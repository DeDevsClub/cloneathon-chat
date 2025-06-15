import { CoreMessage, Message, streamText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';

// Define a more specific type for the parts we are constructing
// type ConstructedMessagePart =
//   | { type: 'text'; text: string }
//   | { type: 'tool-call'; toolCallId: string; toolName: string; args: any };
import { v4 as uuidv4 } from 'uuid';
import { createDataStream } from 'ai';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';
import { Chat } from '@/lib/db';
import z from 'zod';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const {
    messages,
    id,
    system,
    project,
    systemPrompt,
    title,
    visibility,
    model,
    textContent,
    toolCallStreaming,
  } = await req.json();

  const chatId = id ?? uuidv4();
  const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Call the language model
  // Determine projectId for the chat. Allow it to be null if not provided.
  const chatProjectId = project?.id || null;

  // Save chat metadata first
  saveChat({
    id: chatId,
    userId: user.id,
    title: title || messages[0]?.content?.substring(0, 100) || 'New Chat',
    visibility: visibility || 'private',
    projectId: chatProjectId || null,
    systemPrompt: prompt,
    model: model || 'chat-model', // Default model if not provided
    contentType: 'application/vnd.ai.content.v1+json',
    textContent: textContent || '',
  });

  const initialDbMessages = (messages as Message[]).map((m) => ({
    id: (m as any).id?.toString() || uuidv4(),
    chatId: chatId,
    projectId: chatProjectId || null,
    role: m.role,
    attachments: ((m as any).attachments as any[]) || [],
    contentType: 'application/vnd.ai.content.v1+json',
    createdAt: new Date(),
    parts: [],
    textContent: '',
  }));

  if (initialDbMessages.length > 0) {
    saveMessages({ messages: initialDbMessages });
  }
  // Prepare and save initial user messages
  // const initialDbMessages = (messages as Message[]).map((m) => ({
  //   id: (m as any).id?.toString() || uuidv4(),
  //   chatId: chatId, // Use the determined chatId for all messages
  //   projectId: chatProjectId, // Use the determined projectId for all messages
  //   role: m.role || 'user',
  //   // TODO: Implement proper parts and textContent extraction from m.content
  //   parts: m.content ? [{ type: 'text', text: m.content as string }] : [],
  //   textContent: typeof m.content === 'string' ? m.content : '',
  //   attachments: ((m as any).attachments as any[]) || [],
  //   contentType: 'application/vnd.ai.content.v1+json',
  //   createdAt: new Date(),
  // }));

  // if (initialDbMessages.length > 0) {
  //   saveMessages({
  //     messages: initialDbMessages,
  //   });
  // }

  // Call the language model after initial chat and messages are saved
  const result = streamText({
    model: openai('gpt-4o'),
    toolCallStreaming: toolCallStreaming || false,
    messages: messages,
    system: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({ city }: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return {
            weather:
              weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
            temperature: Math.floor(Math.random() * 50 - 10),
          };
        },
      },

      // client-side tool that displays whether information to the user:
      showWeatherInformation: {
        description:
          'Show the weather information to the user. Always use this tool to tell weather information to the user.',
        parameters: z.object({
          city: z.string(),
          weather: z.string(),
          temperature: z.number(),
          typicalWeather: z.string(),
        }),
      },
    },
    async onFinish(result: {
      text: string;
      toolCalls?: Array<{ toolCallId: string; toolName: string; args: any }>;
    }) {
      const { text, toolCalls } = result;
      const assistantMessageParts: {
        type: 'tool-call';
        toolCallId: string;
        toolName: string;
        args: any;
      }[] = [];
      // const assistantMessageParts: ConstructedMessagePart[] = [];
      let assistantTextContent = '';

      if (text) {
        assistantTextContent = text;
      }

      if (Array.isArray(toolCalls)) {
        toolCalls.forEach((tc) => {
          assistantMessageParts.push({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          });
        });
      }

      if (assistantMessageParts.length > 0) {
        const assistantMessageToSave = {
          id: uuidv4(),
          chatId: chatId,
          projectId: chatProjectId,
          role: 'assistant' as const,
          parts: assistantMessageParts,
          textContent: assistantTextContent,
          attachments: [], // Defaulting to empty as streamText onFinish doesn't directly provide attachments
          contentType: 'application/vnd.ai.content.v1+json',
          createdAt: new Date(),
        };
        saveMessages({ messages: [assistantMessageToSave] });
      }
      // Chat metadata is saved before streamText. Updates (e.g., AI-generated title) could happen here if needed.
    },
  });

  // implement your own logic here, e.g. for storing messages
  // or recording token usage

  // implement your own logic here, e.g. for storing messages
  // or recording token usage
  saveChat({
    id: chatId,
    userId: user.id,
    visibility: visibility,
    projectId: chatProjectId || null,
    systemPrompt: systemPrompt,
    model: model,
    title: title,
    contentType: 'application/vnd.ai.content.v1+json',
    textContent: textContent,
  });

  // Respond with the stream
  return result.toDataStreamResponse();
}

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();
  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  // const chatId = request.url.split('/').pop();
  // console.log('getting chat...');

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId') || '';
  console.log({ chatId });
  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
