import { auth } from '@/app/(auth)/auth';
import { getChatCountByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { CHAT_LIMITS } from '@/lib/constants';

export async function GET() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const chatCount = await getChatCountByUserId(user.id);

    return Response.json({
      count: chatCount,
      maxCount: CHAT_LIMITS.MAX_CHATS_PER_USER,
      remaining: CHAT_LIMITS.MAX_CHATS_PER_USER - chatCount,
      percentage: Math.round(
        (chatCount / CHAT_LIMITS.MAX_CHATS_PER_USER) * 100,
      ),
    });
  } catch (error) {
    console.error('Failed to get chat count:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to get chat count',
    ).toResponse();
  }
}
