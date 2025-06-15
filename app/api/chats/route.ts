import OpenAI from 'openai';
import {
  AssistantResponse,
  // smoothStream,
  streamText,
  // UIMessage,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
// import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  // createStreamId,
  deleteChatById,
  getChatById,
  // getMessageCountByUserId,
  // getMessagesByChatId,
  // getStreamIdsByChatId,
  // saveChat,
  // saveMessages,
} from '@/lib/db/queries';
// import { generateUUID, getTrailingMessageId } from '@/lib/utils';
// import { generateTitleFromUserMessage } from '@/app/actions';
// import { createDocument } from '@/lib/ai/tools/create-document';
// import { updateDocument } from '@/lib/ai/tools/update-document';
// import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
// import { getWeather } from '@/lib/ai/tools/get-weather';
// import { isProductionEnvironment } from '@/lib/constants';
// import { myProvider } from '@/lib/ai/providers';
// import { entitlementsByUserType } from '@/lib/ai/entitlements';
// import { postRequestBodySchema, type PostRequestBody } from '../ai/chat/schema'; // Adjusted import path
// import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { openai } from '@ai-sdk/openai';
import z from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, id, system } = await req.json();
  const chat = id ?? uuidv4();
  const session = await auth();
  const user = session?.user;
  console.log({ system });
  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Call the language model
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
    },
    system,
  });

  // Respond with the stream
  return result.toDataStreamResponse();
}
// export async function POST(req: Request) {
//   const { messages } = await req.json();
//   // console.log('messages', messages);

//   const result = streamText({
//     model: openai('gpt-4-turbo'),
//     messages,
//     toolCallStreaming: true,
//     system:
//       'You are a helpful assistant that answers questions about the weather in a given city.' +
//       'You use the showWeatherInformation tool to show the weather information to the user instead of talking about it.',
//     tools: {
//       // server-side tool with execute function:
//       getWeatherInformation: {
//         description: 'show the weather in a given city to the user',
//         parameters: z.object({ city: z.string() }),
//         execute: async ({ city }: { city: string }) => {
//           const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
//           return {
//             weather:
//               weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
//             temperature: Math.floor(Math.random() * 50 - 10),
//           };
//         },
//       },
//       // client-side tool that displays whether information to the user:
//       showWeatherInformation: {
//         description:
//           'Show the weather information to the user. Always use this tool to tell weather information to the user.',
//         parameters: z.object({
//           city: z.string(),
//           weather: z.string(),
//           temperature: z.number(),
//           typicalWeather: z
//             .string()
//             .describe(
//               '2-3 sentences about the typical weather in the city during spring.',
//             ),
//         }),
//       },
//     },
//   });
//   console.log('result', result);
//   return result.toDataStreamResponse();
// }

// let globalStreamContext: ResumableStreamContext | null = null;
// // Create an OpenAI API client (that's edge friendly!)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || '',
// });

// function getStreamContext() {
//   if (!globalStreamContext) {
//     try {
//       globalStreamContext = createResumableStreamContext({
//         waitUntil: after,
//       });
//     } catch (error: any) {
//       if (error.message.includes('REDIS_URL')) {
//         // console.log(
//         //   ' > Resumable streams are disabled due to missing REDIS_URL',
//         // );
//       } else {
//         console.error(error);
//       }
//     }
//   }

//   return globalStreamContext;
// }

// export async function GET(request: Request) {
//   const streamContext = getStreamContext();
//   const resumeRequestedAt = new Date();
//   if (!streamContext) {
//     return new Response(null, { status: 204 });
//   }

//   const chatId = request.url.split('/').pop();
//   console.log('getting chat...');

//   // const { searchParams } = new URL(request.url);
//   // const chatId = searchParams.get('chatId') || '';
//   // console.log({ chatId });
//   if (!chatId) {
//     return new ChatSDKError('bad_request:api').toResponse();
//   }

//   const session = await auth();

//   if (!session?.user) {
//     return new ChatSDKError('unauthorized:chat').toResponse();
//   }

//   let chat: Chat;

//   try {
//     chat = await getChatById({ id: chatId });
//   } catch {
//     return new ChatSDKError('not_found:chat').toResponse();
//   }

//   if (!chat) {
//     return new ChatSDKError('not_found:chat').toResponse();
//   }

//   if (chat.visibility === 'private' && chat.userId !== session.user.id) {
//     return new ChatSDKError('forbidden:chat').toResponse();
//   }

//   const streamIds = await getStreamIdsByChatId({ chatId });

//   if (!streamIds.length) {
//     return new ChatSDKError('not_found:stream').toResponse();
//   }

//   const recentStreamId = streamIds.at(-1);

//   if (!recentStreamId) {
//     return new ChatSDKError('not_found:stream').toResponse();
//   }

//   const emptyDataStream = createDataStream({
//     execute: () => {},
//   });

//   const stream = await streamContext.resumableStream(
//     recentStreamId,
//     () => emptyDataStream,
//   );

//   /*
//    * For when the generation is streaming during SSR
//    * but the resumable stream has concluded at this point.
//    */
//   if (!stream) {
//     const messages = await getMessagesByChatId({ id: chatId });
//     const mostRecentMessage = messages.at(-1);

//     if (!mostRecentMessage) {
//       return new Response(emptyDataStream, { status: 200 });
//     }

//     if (mostRecentMessage.role !== 'assistant') {
//       return new Response(emptyDataStream, { status: 200 });
//     }

//     const messageCreatedAt = new Date(mostRecentMessage.createdAt);

//     if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
//       return new Response(emptyDataStream, { status: 200 });
//     }

//     const restoredStream = createDataStream({
//       execute: (buffer) => {
//         buffer.writeData({
//           type: 'append-message',
//           message: JSON.stringify(mostRecentMessage),
//         });
//       },
//     });

//     return new Response(restoredStream, { status: 200 });
//   }

//   return new Response(stream, { status: 200 });
// }

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
