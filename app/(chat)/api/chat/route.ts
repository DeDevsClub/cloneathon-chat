import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  UIMessage,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { Chat } from '@/lib/db';

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

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log('POST /api/chat - Request body:', JSON.stringify(json));

    try {
      requestBody = postRequestBodySchema.parse(json);
    } catch (parseError) {
      console.error('POST /api/chat - Schema validation error:', parseError);
      return new ChatSDKError('bad_request:api').toResponse();
    }
  } catch (jsonError) {
    console.error('POST /api/chat - JSON parse error:', jsonError);
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      projectId: rawProjectId,
      message,
      selectedChatModel,
      selectedVisibilityType,
    } = requestBody;

    // Validate and normalize projectId - ensure it's a valid UUID or null
    let projectId: string | null = null;
    if (rawProjectId) {
      if (typeof rawProjectId === 'string' && rawProjectId.trim() !== '') {
        try {
          // Simple UUID validation (not comprehensive but catches obvious issues)
          if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              rawProjectId,
            )
          ) {
            projectId = rawProjectId;
          } else {
            console.warn(
              `Invalid projectId format: ${rawProjectId}, using null instead`,
            );
          }
        } catch (e) {
          console.error('Error validating projectId:', e);
        }
      }
    }

    // Ensure message has the required content field
    if (!message.content && message.parts && message.parts.length > 0) {
      // Extract content from text parts if it exists
      try {
        const textParts = message.parts.filter((part) => part.type === 'text');
        if (textParts.length > 0 && textParts[0].text) {
          message.content = textParts[0].text;
        }
      } catch (e) {
        console.error('Error extracting content from parts:', e);
      }
    }

    // Always ensure we have a content string to satisfy TypeScript
    if (!message.content) {
      message.content = message.parts?.[0]?.text || '';
    }

    console.log(
      `POST /api/chat - Processing with validated projectId: ${projectId}`,
    );

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: message as UIMessage,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
        projectId,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    // Transform database message format to AI message format
    const formattedMessages = Array.isArray(previousMessages)
      ? previousMessages.map((dbMsg) => {
          // Ensure role is one of the expected values
          const role = ['user', 'assistant', 'system', 'data'].includes(
            dbMsg.role,
          )
            ? (dbMsg.role as 'user' | 'assistant' | 'system' | 'data')
            : 'user'; // Default to user if unexpected role

          return {
            id: dbMsg.id,
            role,
            content: dbMsg.textContent || '',
            parts: Array.isArray(dbMsg.parts) ? dbMsg.parts : [],
            createdAt: dbMsg.createdAt,
            experimental_attachments: Array.isArray(dbMsg.attachments)
              ? dbMsg.attachments
              : [],
          };
        })
      : [];

    // Add client message to the conversation
    const messages = appendClientMessage({
      messages: formattedMessages,
      message: message as UIMessage,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log(`Saving user message with projectId: ${projectId}`);

    try {
      // Always ensure textContent is a string
      const textContent = message.content || message.parts?.[0]?.text || '';
      console.log(
        `Saving user message with ID: ${message.id}, chatId: ${id}, projectId: ${projectId || 'null'}, content: "${textContent.substring(0, 30)}..."`,
      );

      await saveMessages({
        messages: [
          {
            chatId: id,
            projectId, // Using our validated projectId - can be null or undefined
            id: message.id,
            role: 'user',
            parts: message.parts || [], // Ensure parts is an array
            attachments: message.experimental_attachments ?? [],
            createdAt: new Date(),
            contentType: 'text',
            textContent: textContent, // Use the validated content from the message
          },
        ],
      });
      console.log(`Successfully saved user message with ID: ${message.id}`);
    } catch (saveError) {
      console.error(
        `Error saving user message for chat ${id} with projectId ${projectId}:`,
        saveError,
      );
      // Instead of returning an error, let's log it but continue - this allows the API to create the chat even if message saving fails
      // The UI will still be able to create the chat and then update its project association
      console.log(
        'Continuing despite message save error to allow chat creation',
      );
    }

    const streamId = generateUUID();
    await createStreamId({ userId: session.user.id, streamId, chatId: id });

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  console.error('No assistant message ID found!');
                  return;
                }
                
                try {
                  // Get assistant message from response
                  const [, assistantMessage] = appendResponseMessages({
                    messages: [message as UIMessage],
                    responseMessages: response.messages,
                  });
                  
                  if (!assistantMessage) {
                    console.error('Failed to extract assistant message');
                    return;
                  }
                  
                  // Extract content from message
                  let textContent = '';
                  
                  // First try direct content
                  if (assistantMessage.content) {
                    textContent = assistantMessage.content;
                  } 
                  // Then try to extract from parts if available
                  else if (assistantMessage.parts && assistantMessage.parts.length > 0) {
                    // Look for text parts
                    const textParts = assistantMessage.parts.filter((p: any) => p.type === 'text');
                    if (textParts.length > 0 && 'text' in textParts[0]) {
                      textContent = textParts[0].text;
                    }
                  }
                  
                  console.log(`Saving assistant message with ID: ${assistantMessage.id}, chatId: ${id}, projectId: ${projectId || 'null'}, content length: ${textContent.length}`);
                  
                  // Save the assistant message to database
                  try {
                    await saveMessages({
                      messages: [
                        {
                          chatId: id,
                          projectId, // Using our validated projectId
                          id: assistantMessage.id,
                          role: 'assistant',
                          parts: assistantMessage.parts || [], // Ensure parts is an array
                          attachments: assistantMessage.experimental_attachments ?? [],
                          createdAt: new Date(),
                          contentType: 'text',
                          textContent: textContent, // Use the validated content
                        },
                      ],
                    });
                    console.log(`Successfully saved assistant message with ID: ${assistantMessage.id}`);
                  } catch (saveError) {
                    console.error(`Error saving assistant message for chat ${id}:`, saveError);
                    // Continue execution - don't return error response here as we're mid-stream
                  }
                } catch (processError) {
                  console.error('Error processing assistant message:', processError);
                  // Continue execution
                }
              } catch (error) {
                console.error('Error in assistant message handling:', error);
                // Continue execution
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

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
