'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  getMessagesByChatId,
  updateChatVisiblityById,
  updateChatTitleById,
  getChatsByUserId,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });
  if (!message) return;
  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message?.chatId,
    timestamp: message?.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function updateChatTitle({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  await updateChatTitleById({ chatId, title });
}

export async function getProjectForChat(chatId: string) {
  try {
    const chat = await getChatById({ id: chatId });
    return chat.projectId;
  } catch (error) {
    console.error('Error fetching project for chat:', error);
    return null;
  }
}

export async function getMessagesForChat({ chatId }: { chatId: string }) {
  try {
    const messages = await getMessagesByChatId({ id: chatId });
    return messages;
  } catch (error) {
    console.error('Error fetching messages for chat:', error);
    return null;
  }
}

export async function getChatsForUser({ userId }: { userId: string }) {
  try {
    const messages = await getChatsByUserId({
      id: userId,
      limit: 20,
      startingAfter: null,
      endingBefore: null,
    });
    return messages;
  } catch (error) {
    console.error('Error fetching chats for user:', error);
    return null;
  }
}
