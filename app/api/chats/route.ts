import { CoreMessage, streamText } from 'ai';
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
import { openai } from '@ai-sdk/openai';
import { v4 as uuidv4 } from 'uuid';
import { createDataStream } from 'ai';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';
import { Chat } from '@/lib/db';
import z from 'zod';

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
  } = await req.json();

  const chatId = id ?? uuidv4();
  const projectId = project?.id ?? uuidv4();
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Call the language model
  const result = streamText({
    model: openai('gpt-4-turbo'),
    toolCallStreaming: true,
    messages,
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
    async onFinish({
      text,
      toolCalls,
      toolResults,
      usage,
      finishReason,
      response,
      reasoning,
      reasoningDetails,
    }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
      await saveChat({
        id: chatId,
        userId: user.id,
        visibility: visibility,
        projectId: projectId,
        systemPrompt: systemPrompt,
        model: model,
        title: title,
      });
    },
  });

  const initialDbMessages = (messages as CoreMessage[]).map((m) => ({
    id: (m as any).id?.toString() || uuidv4(),
    chatId: uuidv4(),
    projectId: uuidv4(),
    role: m.role,
    attachments: ((m as any).attachments as any[]) || [],
    contentType: 'application/vnd.ai.content.v1+json',
    createdAt: new Date(),
    parts: [],
    textContent: '',
  }));

  if (initialDbMessages.length > 0) {
    await saveMessages({ messages: initialDbMessages });
  }

  // return Response.json(
  //   { newChatId },
  //   {
  //     status: 201,
  //     headers: { 'X-Chat-Id': newChatId },
  //   },
  // );
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
