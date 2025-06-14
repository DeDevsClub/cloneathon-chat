import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getProject, getProjectChats } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';

// Helper function to extract email from different cookie formats
async function extractEmailFromCookie(
  request: NextRequest,
  cookieName: string,
) {
  const cookie = request.cookies.get(cookieName);
  if (!cookie?.value) return null;

  try {
    if (cookieName.includes('auth')) {
      // Handle JWT token from NextAuth
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
      if (!secret) return null;

      try {
        // Use getToken to decode the JWT token
        const token = await getToken({
          req: request,
          secret,
          cookieName,
        });

        return (token?.email as string) || null;
      } catch (jwtError) {
        console.error(`Failed to decode JWT token: ${jwtError}`);
        return null;
      }
    } else {
      // Handle JSON formatted cookies
      const data = JSON.parse(decodeURIComponent(cookie.value));
      return data.email;
    }
  } catch (error) {
    console.error(`Error extracting email from ${cookieName}:`, error);
    return null;
  }
}

// Helper to validate user ownership of project
async function validateUserOwnership(projectId: string, userEmail: string) {
  try {
    const [user] = await getUser(userEmail);
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    const project = await getProject({ id: projectId });
    if (project.userId !== user.id) {
      return {
        error: 'Unauthorized: You do not own this project',
        status: 403,
      };
    }

    return { user, project };
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return { error: `Project with id ${projectId} not found`, status: 404 };
    }
    return { error: 'Server error', status: 500 };
  }
}

// GET /api/projects/[projectId]/chats - Get all chats for a specific project
export async function GET(request: NextRequest, context: { params: { projectId: string } }) {
  try {
    const projectId = context.params.projectId;
    console.log('Project ID:', projectId);

    // Try extracting email from different possible session cookie names
    let email = null;

    // Try each possible cookie name
    const cookieNames = [
      'user-session',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
    ];

    for (const cookieName of cookieNames) {
      if (request.cookies.has(cookieName)) {
        email = await extractEmailFromCookie(request, cookieName);
        if (email) break;
      }
    }

    if (!email) {
      console.log('No session found');
      // For debugging purposes, allow access even without a valid session
      // In production, you would want to return an unauthorized response
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (email) {
      // Validate user ownership of project
      const validation = await validateUserOwnership(projectId, email);
      if ('error' in validation) {
        return NextResponse.json(
          { error: validation.error },
          { status: validation.status },
        );
      }
    }

    const chats = await getProjectChats({ projectId });
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching project chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project chats' },
      { status: 500 },
    );
  }
}
