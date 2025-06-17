import { getMessagesByChatId } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return Response.json({ error: 'chatId is required' }, { status: 400 });
  }

  try {
    const messages = await getMessagesByChatId({ id: chatId });
    return Response.json({
      chatId,
      messageCount: messages.length,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        textContent: msg.textContent,
        parts: msg.parts,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
