import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chat, project } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Authentication check
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get projectId from search params
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // Get project details
    const projectDetails = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    if (projectDetails.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get all chats associated with this project
    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.projectId, projectId));
    
    // Get all of user's chats (for comparison)
    const userChats = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, session.user.id));
    
    return NextResponse.json({
      project: projectDetails[0],
      projectChats: chats,
      projectChatCount: chats.length,
      userChats: userChats.slice(0, 5), // Only return first 5 for brevity
      userChatCount: userChats.length,
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
