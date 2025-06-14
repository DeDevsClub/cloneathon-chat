import {
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
  getMessagesByChatId,
  getStreamIdsByChatId,
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
import { createDataStream } from 'ai';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        // console.log(
        //   ' > Resumable streams are disabled due to missing REDIS_URL',
        // );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, id } = await req.json();

  // console.log('chat id', id); // can be used for persisting the chat

  // Call the language model
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
    },
  });

  // console.log('result', result);

  // Respond with the stream
  return result.toDataStreamResponse();
}

// export async function POST(request: Request) {
//   let requestBody: PostRequestBody;

//   try {
//     const json = await request.json();
//     console.log('Received chat request...');
//     console.log({ json });
//     requestBody = await postRequestBodySchema?.parse(json);
//     console.log('Submitting chat request...');
//     console.log({ requestBody });
//   } catch (error: any) {
//     console.error(
//       'Zod validation error in /api/chat/route.ts POST:',
//       error.errors,
//     );
//     return new ChatSDKError('bad_request:api', error.message).toResponse();
//   }

//   try {
//     const {
//       id, // This is chatId
//       projectId,
//       messages, // Plural: Array of UIMessage, last one is the new user message
//       selectedChatModel,
//       selectedVisibilityType,
//     } = requestBody;

//     const session = await auth();

//     if (!session?.user) {
//       return new ChatSDKError('unauthorized:chat').toResponse();
//     }

//     const userType: UserType = session.user.type;

//     const messageCount = await getMessageCountByUserId({
//       id: session.user.id,
//       differenceInHours: 24,
//     });

//     if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
//       return new ChatSDKError('rate_limit:chat').toResponse();
//     }

//     const chat = await getChatById({ id });
//     const newUserMessage = messages[messages.length - 1];

//     if (!newUserMessage || newUserMessage.role !== 'user') {
//       console.error(
//         'Last message is not from user or messages array is empty. Received:',
//         messages,
//       );
//       return new ChatSDKError(
//         'bad_request:api',
//         'Invalid message structure: last message must be from user.',
//       ).toResponse();
//     }

//     if (!chat) {
//       const title = await generateTitleFromUserMessage({
//         message: newUserMessage as UIMessage,
//       });

//       await saveChat({
//         id,
//         userId: session.user.id,
//         title,
//         visibility: selectedVisibilityType || 'private',
//         projectId: projectId || null, // Ensure null if undefined
//       });
//     } else {
//       if (chat.userId !== session.user.id) {
//         return new ChatSDKError('forbidden:chat').toResponse();
//       }
//       // TODO: Consider updating chat.projectId if it's null and projectId is now provided
//       // TODO: Consider updating chat.lastActivityAt
//     }

//     // messages from requestBody.messages already includes the newUserMessage
//     // No need to call appendClientMessage here for messages going to AI
//     // We only need to save the newUserMessage to the DB

//     const { longitude, latitude, city, country } = geolocation(request);

//     const requestHints: RequestHints = {
//       longitude,
//       latitude,
//       city,
//       country,
//     };

//     // Save the new user message that came in the request
//     await saveMessages({
//       messages: [
//         {
//           chatId: id,
//           id: newUserMessage.id,
//           role: newUserMessage.role as 'user', // Should always be 'user' here
//           parts: newUserMessage.parts,
//           attachments: newUserMessage.experimental_attachments ?? [],
//           createdAt: new Date(newUserMessage.createdAt || Date.now()), // Ensure Date object
//           projectId: projectId || null, // Ensure null if undefined
//           contentType: null, // Define if applicable
//           textContent:
//             newUserMessage.parts?.find((p) => p.type === 'text')?.text || null, // Extract text content
//         },
//       ],
//     });

//     const streamId = generateUUID();
//     await createStreamId({ userId: session.user.id, streamId, chatId: id });

//     const stream = createDataStream({
//       execute: (dataStream) => {
//         const result = streamText({
//           model: myProvider.languageModel(selectedChatModel || 'chat-model'),
//           system: systemPrompt({
//             selectedChatModel: selectedChatModel || 'chat-model',
//             requestHints,
//           }),
//           messages: messages, // Pass the full history from requestBody
//           maxSteps: 5,
//           experimental_activeTools:
//             selectedChatModel === 'chat-model-reasoning'
//               ? []
//               : [
//                   'getWeather',
//                   'createDocument',
//                   'updateDocument',
//                   'requestSuggestions',
//                 ],
//           experimental_transform: smoothStream({ chunking: 'word' }),
//           experimental_generateMessageId: generateUUID,
//           tools: {
//             getWeather,
//             createDocument: createDocument({ session, dataStream }),
//             updateDocument: updateDocument({ session, dataStream }),
//             requestSuggestions: requestSuggestions({
//               session,
//               dataStream,
//             }),
//           },
//           onFinish: async ({ response }) => {
//             if (session.user?.id) {
//               try {
//                 const assistantId = getTrailingMessageId({
//                   messages: response.messages.filter(
//                     (msg) => msg.role === 'assistant',
//                   ),
//                 });

//                 if (!assistantId) {
//                   throw new Error('No assistant message found!');
//                 }

//                 // appendResponseMessages needs the history *before* AI response,
//                 // and then the AI's response messages.
//                 // `messages` (from requestBody) is the history up to and including the last user message.
//                 // Ensure all createdAt fields are Date objects for appendResponseMessages
//                 const messagesForAppend = messages.map((msg) => ({
//                   ...msg,
//                   createdAt: msg.createdAt
//                     ? new Date(msg.createdAt)
//                     : undefined,
//                 }));

//                 const [, assistantMessage] = appendResponseMessages({
//                   messages: messagesForAppend,
//                   responseMessages: response.messages,
//                 });

//                 await saveMessages({
//                   messages: [
//                     {
//                       id: assistantId,
//                       chatId: id,
//                       projectId: projectId || null, // Ensure null if undefined
//                       role: assistantMessage.role,
//                       parts: assistantMessage.parts,
//                       attachments:
//                         assistantMessage.experimental_attachments ?? [],
//                       createdAt: new Date(),
//                       contentType: null, // Define if applicable
//                       textContent:
//                         assistantMessage.parts?.find((p) => p.type === 'text')
//                           ?.text || null, // Extract text content
//                     },
//                   ],
//                 });
//               } catch (error) {
//                 console.error(
//                   'Failed to save assistant message in /api/chat/route.ts:',
//                   error,
//                 );
//               }
//             }
//           },
//           experimental_telemetry: {
//             isEnabled: isProductionEnvironment,
//             functionId: 'stream-text',
//           },
//         });

//         result.consumeStream();

//         result.mergeIntoDataStream(dataStream, {
//           sendReasoning: true,
//         });
//       },
//       onError: (error) => {
//         console.error('Streaming error in /api/chat/route.ts:', error);
//         return 'Oops, an error occurred!';
//       },
//     });

//     const streamContext = getStreamContext();

//     if (streamContext) {
//       return new Response(
//         await streamContext.resumableStream(streamId, () => stream),
//       );
//     } else {
//       return new Response(stream);
//     }
//   } catch (error) {
//     console.error('POST handler error in /api/chat/route.ts:', error);
//     if (error instanceof ChatSDKError) {
//       return error.toResponse();
//     }
//     // Use a valid ChatSDKError code
//     return new ChatSDKError(
//       'bad_request:api',
//       (error as Error).message,
//     ).toResponse();
//   }
// }

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();
  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

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
