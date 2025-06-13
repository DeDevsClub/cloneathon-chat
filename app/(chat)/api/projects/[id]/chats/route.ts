import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/db/project';
import { getChatsByProjectId } from '@/lib/db/chat';
import { getUser } from '@/lib/db/queries';

// GET /api/projects/[id]/chats - Get all chats for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionCookie = request.cookies.get('user-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the session cookie value to get user email
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    const email = sessionData.email;

    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists and user has access to it
    try {
      const project = await getProject({ id: params.id });

      // Check if user owns the project
      if (project.userId !== user.id) {
        return NextResponse.json(
          { error: 'You do not have access to this project' },
          { status: 403 },
        );
      }

      // Get all chats for this project
      const chats = await getChatsByProjectId({
        projectId: params.id,
        userId: user.id,
      });

      return NextResponse.json({ chats });
    } catch (error: any) {
      if (error?.message?.includes('not found')) {
        return NextResponse.json(
          { error: `Project with id ${params.id} not found` },
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
