'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr'; // useSWR removed as unused
import { ChatHeader } from '@/components/chat/chat-header';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils'; // fetcher removed as unused
import { Artifact, type UIArtifact } from '@/components/chat/artifact'; // Added UIArtifact import
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { Messages } from '@/components/chat/messages';
import type { VisibilityType } from '@/components/visibility-selector'; // Restored VisibilityType import
import { useArtifactSelector } from '@/hooks/use-artifact'; // Restored useArtifactSelector and corrected path
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/components/navigation/sidebar-history';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
// import { ChatSDKError } from '@/lib/errors';

export function Chat({
  chatId,
  projectId,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  chatId: string;
  projectId: string | null;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType,
  });

  // const {
  //   messages,
  //   setMessages,
  //   handleSubmit,
  //   input,
  //   setInput,
  //   append,
  //   status,
  //   stop,
  //   reload,
  //   experimental_resume,
  //   data,
  //   error,
  // } = useChat({
  //   id: chatId,
  //   initialMessages,
  //   experimental_throttle: 100,
  //   sendExtraMessageFields: true,
  //   generateId: generateUUID,
  //   fetch: fetchWithErrorHandlers,
  //   api: '/api/chats', // Use the correct AI chat endpoint
  //   experimental_prepareRequestBody: (body) => {
  //     console.log('Preparing request body with projectId:', projectId);
  //     console.log('Chat request body:', JSON.stringify(body, null, 2));
  //     // Send the messages array directly as expected by the OpenAI API
  //     return {
  //       ...body, // Keep all original properties
  //       projectId: projectId || null, // Add project ID for context
  //       selectedChatModel: initialChatModel || 'chat-model',
  //       selectedVisibilityType: visibilityType,
  //     };
  //   },
  //   onFinish: () => {
  //     mutate(unstable_serialize(getChatHistoryPaginationKey));
  //   },
  //   onError: (error) => {
  //     console.error('Chat error:', error);
  //     if (error instanceof ChatSDKError) {
  //       toast({
  //         type: 'error',
  //         description: error.message,
  //       });
  //     } else {
  //       toast({
  //         type: 'error',
  //         description: 'Failed to get AI response. Please try again.',
  //       });
  //     }
  //   },
  // });

  const {
    error,
    input,
    status,
    handleInputChange,

    handleSubmit,
    messages,
    reload,
    stop,
    // old
    experimental_resume, //
    data,
    setMessages,
    setInput,
    append,
  } = useChat({
    id: chatId,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    api: '/api/chats', // Use the correct AI chat endpoint

    onFinish(message, { usage, finishReason }) {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // console.log('Usage', usage);
      // console.log('FinishReason', finishReason);
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      // window.history.replaceState({}, '', `/projects/${projectId}`);
    }
  }, [hasAppendedQuery, status, input, messages, projectId]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector(
    (state: UIArtifact) => state.isVisible,
  );

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <>
      <ChatHeader
        chatId={chatId}
        selectedModelId={initialChatModel}
        selectedVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        session={session}
      />

      <div className="flex flex-col w-full min-w-full h-dvh justify-center scrollbar-transparent">
        <Messages
          chatId={chatId}
          status={status}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex p-2 max-w-full justify-center dark:bg-slate-950/50 bg-slate-50">
          {/* <div className="flex bg-background h-fit justify-center"> */}
          {!isReadonly && (
            <MultimodalInput
              chatId={chatId}
              projectId={projectId || null}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )}

          <Artifact
            chatId={chatId}
            projectId={projectId || null}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />
        </div>
      </div>
    </>
  );
}
