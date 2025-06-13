import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getProject } from '@/lib/db/project';
import { getChatsByProjectId } from '@/lib/db/chat';
import { getUser } from '@/lib/db/queries';

// Helper function to extract email from different cookie formats
async function extractEmailFromCookie(request: NextRequest, cookieName: string) {
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

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    console.error(`DEBUG - GET project/${context.params.id}/chats - ALL COOKIES: ${JSON.stringify([...request.cookies.getAll().map((c) => ({ name: c.name, value: `${c.value?.slice(0, 10)}...` }))])}`);
    
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
        console.error(`DEBUG - GET project/${context.params.id}/chats - Trying cookie: ${cookieName}`);
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.error(`DEBUG - GET project chats - Found valid email in cookie ${cookieName}: ${email}`);
          break;
        }
      }
    }
    
    if (!email) {
      console.error('DEBUG - GET project chats - No valid session found or could not extract email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists and user has access to it
    try {
      const project = await getProject({ id: context.params.id });

      // Check if user owns the project
      if (project.userId !== user.id) {
        return NextResponse.json(
          { error: 'You do not have access to this project' },
          { status: 403 },
        );
      }

      // Get all chats for this project
      const chats = await getChatsByProjectId({
        projectId: context.params.id,
        userId: user.id,
      });

      return NextResponse.json({ chats });
    } catch (error: any) {
      if (error?.message?.includes('not found')) {
        return NextResponse.json(
          { error: `Project with id ${context.params.id} not found` },
          { status: 404 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching project chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats for this project' },
      { status: 500 },
    );
  }
}
