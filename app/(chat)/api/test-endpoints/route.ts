import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMessagesByChatId } from '@/lib/db/queries';

/**
 * Test endpoint for fetching messages by chat ID
 * Protected by authentication
 * GET /api/test-endpoints?chatId=<chat_id>
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chatId from query params
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Fetch messages using the existing query function
    const messages = await getMessagesByChatId({ id: chatId });

    // Return messages with additional metadata
    return NextResponse.json({
      success: true,
      chatId,
      messageCount: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}
