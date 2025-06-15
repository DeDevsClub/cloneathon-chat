import { db } from './index';
import { ChatSDKError } from '../errors';
import { chat } from './schema';
import { and, eq, desc } from 'drizzle-orm';

/**
 * Creates a new chat with optional project association
 */
export async function createChat({
  id,
  userId,
  title,
  visibility,
  projectId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: 'public' | 'private';
  projectId?: string | null;
}) {
  try {
    const [newChat] = await db
      .insert(chat)
      .values({
        id,
        createdAt: new Date(),
        userId,
        title,
        visibility,
        projectId: projectId || null,
      })
      .returning();

    return newChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create chat');
  }
}

/**
 * Get chats by project ID
 */
export async function getChatsByProjectId({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  try {
    // Get all chats for the project
    const chats = projectId
      ? await db
          .select()
          .from(chat)
          .where(and(eq(chat.projectId, projectId), eq(chat.userId, userId)))
          .orderBy(desc(chat.createdAt))
      : await db
          .select()
          .from(chat)
          .where(eq(chat.userId, userId))
          .orderBy(desc(chat.createdAt));

    return chats;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by project id',
    );
  }
}
