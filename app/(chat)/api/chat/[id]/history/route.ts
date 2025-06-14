import { NextRequest, NextResponse } from 'next/server';
import { getMessagesByChatId, getChatById } from '@/lib/db/queries';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Use hybrid authentication
    const auth = await authenticateRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');

    // Verify the chat exists
    const chat = await getChatById({ id: id! });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // For cookie/JWT auth, verify user has access to this chat
    if (
      auth.authenticationType !== 'apiKey' &&
      chat.visibility === 'private' &&
      chat.userId !== auth.userId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized access to chat' },
        { status: 403 },
      );
    }

    // Verify the user owns the chat or the chat is public
    if (chat.visibility === 'private' && chat.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to chat' },
        { status: 403 },
      );
    }

    // Get all messages for the chat
    const messages = await getMessagesByChatId({ id: id! });

    // Format the response
    const response = {
      chatId: id,
      title: chat.title || 'Untitled Chat',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      visibility: chat.visibility,
      projectId: chat.projectId,
      messageCount: messages.length,
      messages: messages.map((message) => ({
        id: message.id,
        content: message.textContent,
        role: message.role,
        createdAt: message.createdAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 },
    );
  }
}
