import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getProject } from '@/lib/db/project';
import { getChatsByProjectId } from '@/lib/db/chat';
import { getUser } from '@/lib/db/queries';

// Standard Next.js App Router handler pattern
export async function GET(request: NextRequest) {
  try {
    // Extract project ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.indexOf('projects') + 1];
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID not provided' }, { status: 400 });
    }
    
    // Extract email from cookie
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Auth configuration error' }, { status: 500 });
    }
    
    const token = await getToken({ req: request, secret });
    const email = token?.email as string;
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists and user has access to it
    const project = await getProject({ id: projectId });
    if (!project) {
      return NextResponse.json(
        { error: `Project with id ${projectId} not found` },
        { status: 404 }
      );
    }

    // Check if user owns the project
    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Get all chats for this project
    const chats = await getChatsByProjectId({
      projectId,
      userId: user.id,
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching project chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats for this project' },
      { status: 500 }
    );
  }
}
