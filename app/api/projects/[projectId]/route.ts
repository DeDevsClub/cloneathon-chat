import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';

import { getProject, updateProject, deleteProject } from '@/lib/db/project';
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

// Schema for project updates
const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

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

// GET /api/projects/[projectId] - Get a specific project
export async function GET(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];
  try {
    console.error(
      `DEBUG - GET project/${projectId} - ALL COOKIES: ${JSON.stringify([...request.cookies.getAll().map((c) => ({ name: c.name, value: `${c.value?.slice(0, 10)}...` }))])}`,
    );

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
        console.error(
          `DEBUG - GET project/${projectId} - Trying cookie: ${cookieName}`,
        );
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.error(
            `DEBUG - GET project/${projectId} - Found valid email in cookie ${cookieName}: ${email}`,
          );
          break;
        }
      }
    }

    if (!email) {
      console.error(
        'DEBUG - GET project details - No valid session found or could not extract email',
      );
      // For debugging purposes, allow access even without a valid session
      // In production, you would want to return an unauthorized response
      // TODO : Remove this in production
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    return NextResponse.json({ project: validation.project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 },
    );
  }
}

// PATCH /api/projects/[projectId] - Update a project
export async function PATCH(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];
  try {
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
      // console.log('No session found');
      // For debugging purposes, allow access even without a valid session
      // In production, you would want to return an unauthorized response
      // TODO : Remove this in production
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const body = await request.json();
    const schema = updateProjectSchema.safeParse(body);

    if (!schema.success) {
      return NextResponse.json({ error: schema.error.errors }, { status: 400 });
    }

    const updatedProject = await updateProject({
      id: projectId,
      name: schema.data.name,
      //   todo: handle optional fields
      description: schema.data.description || '',
      icon: schema.data.icon || '',
      color: schema.data.color || '#4f46e5',
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];
  try {
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
      // console.log('No session found');
      // For debugging purposes, allow access even without a valid session
      // In production, you would want to return an unauthorized response
      // TODO : Remove this in production
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    await deleteProject({ id: projectId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 },
    );
  }
}
