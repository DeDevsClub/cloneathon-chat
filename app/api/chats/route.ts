import { streamText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getChatCountByUserId,
  getChatCountByProjectId,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_VISIBILITY_TYPE,
  CHAT_LIMITS,
  CHAT_LIMIT_ERRORS,
} from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { getEnabledTools } from '@/lib/tools';

export const maxDuration = 60;

// Type for the parts we construct
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: any }
  | { type: 'reasoning'; reasoning: string };

export async function POST(req: Request) {
  try {
    // Extract and validate the request body
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
      toolsEnabled,
    } = await req.json();

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new ChatSDKError(
        'bad_request:api',
        'Messages array is required and cannot be empty',
      ).toResponse();
    }

    const chatId = id ?? uuidv4();
    const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const session = await auth();
    const user = session?.user;

    if (!user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Check if chat already exists to prevent duplicates
    let existingChat = null;
    if (id) {
      try {
        existingChat = await getChatById({ id: chatId });
        if (existingChat && existingChat.userId === user.id) {
          console.log(`Chat ${chatId} already exists, continuing conversation`);
          // Don't return early - continue to process new messages and AI response
        }
      } catch (error) {
        // Chat doesn't exist, which is what we want for new creation
        console.log(`Chat ${chatId} does not exist, proceeding with creation`);
      }
    }

    // Determine projectId for the chat. Allow it to be null if not provided.
    const chatProjectId = project?.id || null;

    // Extract title from first message if not provided
    const chatTitle =
      title ||
      (typeof messages[0]?.content === 'string'
        ? messages[0].content.substring(0, 100)
        : null) ||
      'New Chat';

    console.log(
      `Creating chat with: ${JSON.stringify({ chatId, chatTitle, userId: user.id, chatProjectId })}`,
    );

    // Save chat metadata first (with proper await) - only if chat doesn't exist
    if (!existingChat) {
      try {
        // Check user's total chat count before creating new chat
        const userChatCount = await getChatCountByUserId(user.id);
        if (userChatCount >= CHAT_LIMITS.MAX_CHATS_PER_USER) {
          return new ChatSDKError(
            'bad_request:chat',
            CHAT_LIMIT_ERRORS.MAX_CHATS_EXCEEDED,
          ).toResponse();
        }

        // Check project chat count if chat is associated with a project
        if (chatProjectId) {
          const projectChatCount = await getChatCountByProjectId(chatProjectId);
          if (projectChatCount >= CHAT_LIMITS.MAX_CHATS_PER_PROJECT) {
            return new ChatSDKError(
              'bad_request:chat',
              CHAT_LIMIT_ERRORS.MAX_PROJECT_CHATS_EXCEEDED,
            ).toResponse();
          }
        }

        await saveChat({
          id: chatId,
          userId: user.id,
          title: chatTitle,
          visibility: visibility || DEFAULT_VISIBILITY_TYPE,
          projectId: chatProjectId,
          systemPrompt: prompt,
          model: model || DEFAULT_CHAT_MODEL,
          contentType: 'application/vnd.ai.content.v1+json',
          textContent: textContent || '',
        });
        console.log('Chat saved successfully');
      } catch (error) {
        console.error('Failed to save chat:', error);

        // Check if this is a duplicate key error
        if (
          error instanceof ChatSDKError &&
          error.type === 'bad_request' &&
          error.surface === 'chat'
        ) {
          console.log(
            `Duplicate chat ID ${chatId} detected, returning existing chat`,
          );
          return Response.json(
            { id: chatId, message: 'Chat already exists' },
            { status: 200 },
          );
        }

        return new ChatSDKError(
          'bad_request:database',
          'Failed to create chat',
        ).toResponse();
      }
    } else {
      console.log('Chat already exists, skipping chat creation');
    }

    // Extract and validate message content properly
    const extractMessageContent = (message: any) => {
      const parts: MessagePart[] = [];
      let textContent = message.content;

      if (typeof message.content === 'string') {
        // Simple string content
        parts.push({ type: 'text', text: message.content });
        textContent = message.content;
      } else if (Array.isArray(message.content)) {
        // Array of content parts
        message.content.forEach((part: any) => {
          if (part.type === 'text' && part.text) {
            parts.push({ type: 'text', text: part.text });
            textContent = `${textContent}${part.text} `;
          } else if (part.type === 'tool-call') {
            parts.push({
              type: 'tool-call',
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: part.args,
            });
          }
        });
        textContent = textContent.trim();
      } else if (message.content && typeof message.content === 'object') {
        // Single content object
        if (message.content.text) {
          parts.push({ type: 'text', text: message.content.text });
          textContent = message.content.text;
        }
      }

      return { parts, textContent };
    };

    // Prepare and save initial user messages with proper content extraction
    const initialDbMessages = messages.map((m: any) => {
      const { parts, textContent } = extractMessageContent(m);

      return {
        id: m.id?.toString() || uuidv4(),
        chatId: chatId,
        projectId: chatProjectId,
        role: m.role || 'user',
        parts: parts,
        textContent: textContent,
        attachments: m.attachments || [],
        contentType: 'application/vnd.ai.content.v1+json',
        createdAt: new Date(),
      };
    });

    // Save initial messages (with proper await)
    if (initialDbMessages.length > 0) {
      try {
        await saveMessages({ messages: initialDbMessages });
        console.log('Initial messages saved successfully');
      } catch (error) {
        console.error('Failed to save initial messages:', error);
        // If messages fail to save but chat was created, continue with streaming
        // The chat is already created and can be used
      }
    }

    console.log('Initial messages:', initialDbMessages);

    // Call the language model after initial chat and messages are saved
    console.log('About to call streamText...');
    const modelId = model || DEFAULT_CHAT_MODEL;
    console.log('Model ID:', modelId);
    console.log('Model:', myProvider.languageModel(modelId));
    console.log('Messages length:', messages.length);
    console.log('System prompt:', prompt);
    console.log('Tools enabled:', toolsEnabled);
    console.log('Tool call streaming:', toolCallStreaming);

    const result = streamText({
      model: myProvider.languageModel(modelId),
      toolCallStreaming: toolCallStreaming || false,
      messages: messages,
      system: prompt,
      tools: getEnabledTools(toolsEnabled),
      async onFinish(result: {
        text: string;
        toolCalls?: Array<{ toolCallId: string; toolName: string; args: any }>;
        toolResults?: Array<{
          toolCallId: string;
          toolName: string;
          result: any;
        }>;
        reasoning?: string;
      }) {
        try {
          const { text, toolCalls, toolResults, reasoning } = result;
          console.log('onFinish called with:', {
            hasText: !!text,
            hasToolCalls: !!toolCalls,
            hasToolResults: !!toolResults,
            hasReasoning: !!reasoning,
            reasoningLength: reasoning?.length,
            reasoning: reasoning
              ? `${reasoning.substring(0, 200)}...`
              : undefined, // First 200 chars
          });

          const assistantMessageParts: MessagePart[] = [];
          let assistantTextContent = '';

          // Add reasoning steps if available (when using reasoning model)
          if (reasoning) {
            console.log('Adding reasoning part to message');
            assistantMessageParts.push({
              type: 'reasoning',
              reasoning: reasoning,
            } as any);
          } else {
            console.log('No reasoning found in result');
          }

          if (text) {
            assistantMessageParts.push({ type: 'text', text });
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
            console.log('Assistant message parts:', assistantMessageParts);
            const assistantMessageToSave = {
              id: uuidv4(),
              chatId: chatId,
              projectId: chatProjectId,
              role: 'assistant' as const,
              parts: assistantMessageParts,
              textContent: assistantTextContent,
              attachments: [],
              contentType: 'application/vnd.ai.content.v1+json',
              createdAt: new Date(),
            };
            console.log('Assistant message to save:', assistantMessageToSave);
            await saveMessages({ messages: [assistantMessageToSave] });
            console.log('Assistant message saved successfully');
          }
        } catch (error) {
          console.error('Failed to save assistant message:', error);
          // Don't throw here as it would interrupt the stream
        }
      },
    });

    // Respond with the stream
    console.log('Streaming response...');
    console.log(result);
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in POST /api/chats:', error);
    return new ChatSDKError(
      'bad_request:api',
      'An unexpected error occurred',
    ).toResponse();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId') || '';
  console.log({ chatId });

  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: any;

  try {
    chat = await getChatById({ id: chatId });
  } catch (error) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  return Response.json(chat, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId') || '';

  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const chat = await getChatById({ id: chatId });

    if (chat.userId !== user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }
  } catch (error) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  let deletedChat: Awaited<ReturnType<typeof deleteChatById>>;

  try {
    deletedChat = await deleteChatById({ id: chatId });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat',
    ).toResponse();
  }

  return Response.json(deletedChat, { status: 200 });
}
