import { config } from 'dotenv';
import postgres from 'postgres';
import { chat, message, vote } from '../schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { inArray } from 'drizzle-orm';
import { appendResponseMessages, type UIMessage } from 'ai';

config({
  path: '.env',
});

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

const BATCH_SIZE = 100; // Process 100 chats at a time
const INSERT_BATCH_SIZE = 1000; // Insert 1000 messages at a time

type NewMessageInsert = {
  id: string;
  chatId: string;
  parts: any[];
  role: string;
  attachments: any[];
  createdAt: Date;
  contentType: string | null;
  textContent: string | null;
};

type NewVoteInsert = {
  messageId: string;
  chatId: string;
  userId: string;
  isUpvoted: boolean;
  createdAt: Date;
};

interface MessageContentPart {
  type: string;
  content: unknown;
}
interface Message {
  role: string;
  content: MessageContentPart[];
  createdAt: Date;
}
function getMessageRank(message: Message): number {
  if (
    message.role === 'assistant' &&
    (message.content as MessageContentPart[]).some(
      (contentPart) => contentPart.type === 'tool-call',
    )
  ) {
    return 0;
  }

  if (
    message.role === 'tool' &&
    (message.content as MessageContentPart[]).some(
      (contentPart) => contentPart.type === 'tool-result',
    )
  ) {
    return 1;
  }

  if (message.role === 'assistant') {
    return 2;
  }

  return 3;
}

function dedupeParts<T extends { type: string; [k: string]: any }>(
  parts: T[],
): T[] {
  const seen = new Set<string>();
  return parts.filter((p) => {
    const key = `${p.type}|${JSON.stringify(p.content ?? p)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeParts<T extends { type: string; [k: string]: any }>(
  parts: T[],
): T[] {
  return parts.filter(
    (part) => !(part.type === 'reasoning' && part.reasoning === 'undefined'),
  );
}

async function migrateMessages() {
  const allChats = await db.select().from(chat);

  let processedCount = 0;

  for (let i = 0; i < allChats.length; i += BATCH_SIZE) {
    const chatBatch = allChats.slice(i, i + BATCH_SIZE);
    const chatIds = chatBatch.map((chat) => chat.id);

    const allMessages = await db
      .select()
      .from(message)
      .where(inArray(message.chatId, chatIds));

    const allVotes = await db
      .select()
      .from(vote)
      .where(inArray(vote.chatId, chatIds));

    const newMessagesToInsert: NewMessageInsert[] = [];
    const newVotesToInsert: NewVoteInsert[] = [];

    for (const chat of chatBatch) {
      processedCount++;
      console.info(`Processed ${processedCount}/${allChats.length} chats`);

      const messages = allMessages
        .filter((message) => message.chatId === chat.id)
        .sort((a: any, b: any) => {
          const differenceInTime =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          if (differenceInTime !== 0) return differenceInTime;

          return getMessageRank(a) - getMessageRank(b);
        });

      const votes = allVotes.filter((v) => v.chatId === chat.id);

      const messageSection: Array<UIMessage> = [];
      const messageSections: Array<Array<UIMessage>> = [];

      for (const message of messages) {
        const { role } = message;

        if (role === 'user' && messageSection.length > 0) {
          messageSections.push([...messageSection]);
          messageSection.length = 0;
        }

        // @ts-expect-error message.content has different type
        messageSection.push(message);
      }

      if (messageSection.length > 0) {
        messageSections.push([...messageSection]);
      }

      for (const section of messageSections) {
        const [userMessage, ...assistantMessages] = section;

        const [firstAssistantMessage] = assistantMessages;

        try {
          const uiSection = appendResponseMessages({
            messages: [userMessage],
            // @ts-expect-error: message.content has different type
            responseMessages: assistantMessages,
            _internal: {
              currentDate: () => firstAssistantMessage.createdAt ?? new Date(),
            },
          });

          const projectedUISection = uiSection
            .map((message) => {
              if (message.role === 'user') {
                return {
                  id: message.id,
                  chatId: chat.id,
                  parts: [{ type: 'text', text: message.content }],
                  role: message.role,
                  createdAt: message.createdAt,
                  attachments: [],
                  contentType: null,
                  textContent: message.content as string,
                } as NewMessageInsert;
              } else if (message.role === 'assistant') {
                const cleanParts = sanitizeParts(
                  dedupeParts(message.parts || []),
                );

                return {
                  id: message.id,
                  chatId: chat.id,
                  parts: cleanParts,
                  role: message.role,
                  createdAt: message.createdAt,
                  attachments: [],
                  contentType: null,
                  textContent:
                    cleanParts.find((p) => p.type === 'text')?.text || null,
                } as NewMessageInsert;
              }
              return null;
            })
            .filter((msg): msg is NewMessageInsert => msg !== null);

          for (const msg of projectedUISection) {
            newMessagesToInsert.push(msg);

            if (msg.role === 'assistant') {
              const voteByMessage = votes.find((v) => v.messageId === msg.id);
              if (voteByMessage) {
                newVotesToInsert.push({
                  chatId: msg.chatId,
                  messageId: msg.id,
                  userId: voteByMessage.userId,
                  isUpvoted: voteByMessage.isUpvoted,
                  createdAt: new Date(),
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error processing chat ${chat.id}: ${error}`);
        }
      }
    }

    for (let j = 0; j < newMessagesToInsert.length; j += INSERT_BATCH_SIZE) {
      const messageBatch = newMessagesToInsert.slice(j, j + INSERT_BATCH_SIZE);
      if (messageBatch.length > 0) {
        const validMessageBatch = messageBatch.map((msg) => ({
          id: msg.id,
          chatId: msg.chatId,
          parts: msg.parts,
          role: msg.role,
          attachments: msg.attachments,
          createdAt: msg.createdAt,
          contentType: msg.contentType,
          textContent: msg.textContent,
        }));

        await db.insert(message).values(validMessageBatch);
      }
    }

    for (let j = 0; j < newVotesToInsert.length; j += INSERT_BATCH_SIZE) {
      const voteBatch = newVotesToInsert.slice(j, j + INSERT_BATCH_SIZE);
      if (voteBatch.length > 0) {
        await db.insert(vote).values(
          voteBatch.map((vote) => ({
            chatId: vote.chatId,
            messageId: vote.messageId,
            userId: vote.userId,
            isUpvoted: vote.isUpvoted,
            createdAt: vote.createdAt,
          })),
        );
      }
    }
  }

  console.info(`Migration completed: ${processedCount} chats processed`);
}

migrateMessages()
  .then(() => {
    console.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
