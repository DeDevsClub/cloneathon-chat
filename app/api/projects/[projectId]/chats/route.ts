import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getProject, getProjectChats } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';
import { createChat } from '@/lib/db/chat';
import { DEFAULT_VISIBILITY_TYPE } from '@/lib/constants';
import { chat } from '@/lib/db';

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

// Schema for chat creation
const createChatSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Chat title is required').max(255),
  visibility: z.enum(['public', 'private']).default(DEFAULT_VISIBILITY_TYPE),
  selectedChatModel: z.string().optional(),
  message: z
    .object({
      content: z.string().optional(),
    })
    .optional(),
});

// GET /api/projects/[projectId]/chats - Get all chats for a specific project
export async function GET(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];

  console.log(
    `DEBUG - GET project/${projectId}/chats - Starting request processing`,
  );

  try {
    // Get session using NextAuth
    const session = await auth();
    console.log(
      `DEBUG - GET project/${projectId}/chats - Session:`,
      session ? 'Found' : 'Not found',
    );

    if (!session || !session.user || !session.user.email) {
      console.log(
        `DEBUG - GET project/${projectId}/chats - No valid session found`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    console.log(
      `DEBUG - GET project/${projectId}/chats - Email from session:`,
      email,
    );

    // Validate user ownership of project
    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      console.log(
        `DEBUG - GET project/${projectId}/chats - Validation failed:`,
        validation.error,
      );
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const chats = await getProjectChats({ projectId });
    console.log(
      `DEBUG - GET project/${projectId}/chats - Found ${chats.length} chats`,
    );
    return NextResponse.json({ chats });
  } catch (error) {
    console.error(`DEBUG - GET project/${projectId}/chats - Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch project chats' },
      { status: 500 },
    );
  }
}

// POST /api/projects/[projectId]/chats - Create a new chat for a specific project
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.indexOf('projects') + 1];

    console.log(
      `DEBUG - POST project/${projectId}/chats - Starting chat creation`,
    );

    // Get session using NextAuth
    const session = await auth();
    console.log(
      `DEBUG - POST project/${projectId}/chats - Session:`,
      session ? 'Found' : 'Not found',
    );

    if (!session || !session.user || !session.user.email) {
      console.log(
        `DEBUG - POST project/${projectId}/chats - No valid session found`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    console.log(
      `DEBUG - POST project/${projectId}/chats - Email from session:`,
      email,
    );

    // Validate user ownership of project
    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      console.log(
        `DEBUG - POST project/${projectId}/chats - Validation failed:`,
        validation.error,
      );
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const { user, project } = validation;
    console.log(
      `DEBUG - POST project/${projectId}/chats - User validated, project: ${project.name}`,
    );

    // Parse and validate request body
    const body = await request.json();
    console.log(
      `DEBUG - POST project/${projectId}/chats - Request body:`,
      body,
    );

    const validationResult = createChatSchema.safeParse(body);

    if (!validationResult.success) {
      console.log(
        `DEBUG - POST project/${projectId}/chats - Schema validation failed:`,
        validationResult.error.errors,
      );
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { id, title, visibility } = validationResult.data;

    // Create the chat with project association
    const newChat = await createChat({
      id,
      userId: user.id,
      title: title || 'New Chat',
      visibility,
      projectId, // This is the key - associates chat with the project
    });

    console.log(
      `DEBUG - POST project/${projectId}/chats - Chat created successfully:`,
      {
        chatId: newChat.id,
        title: newChat.title,
        projectId: newChat.projectId,
        userId: newChat.userId,
      },
    );

    return NextResponse.json({ chat: newChat }, { status: 201 });
  } catch (error) {
    const projectId = chat.projectId;

    console.error(
      `DEBUG - POST project/${projectId}/chats - Error creating chat:`,
      error,
    );
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 },
    );
  }
}
