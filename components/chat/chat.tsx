'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat/chat-header';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from '@/components/chat/artifact';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { Messages } from '@/components/chat/messages';
import type { VisibilityType } from '@/components/visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/components/navigation/sidebar-history';
import { toast } from '@/components/toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { SuggestedActions } from '@/components/chat/suggested-actions';
import { Vote } from '@/lib/db';

export function Chat({
  projectId,
  chatId,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  projectId: string | null;
  chatId: string;
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
  //   api: '/api/chat', // Use the correct AI chat endpoint
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
    onFinish(message, { usage, finishReason }) {
      // console.log('Usage', usage);
      // console.log('FinishReason', finishReason);
    },
  });

  // const searchParams = useSearchParams();
  // const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    // if (query && !hasAppendedQuery) {
    //   append({
    //     role: 'user',
    //     content: query,
    //   });

    setHasAppendedQuery(true);
    // window.history.replaceState({}, '', `/projects/${projectId}`);
    // }
  }, [hasAppendedQuery, status, input, messages]);

  // TODO enable voting
  const { data: votes } = useSWR<Array<Vote>>(
    messages?.length >= 2 ? `/api/chat/vote?chatId=${chatId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <div className="flex flex-col w-full min-w-full h-dvh justify-center scrollbar-transparent">
      {/* <ChatHeader
        chatId={chatId}
        selectedModelId={initialChatModel}
        selectedVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        session={session}
      /> */}

      <Messages
        chatId={chatId}
        status={status}
        votes={votes || []}
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
          votes={votes}
          isReadonly={isReadonly}
          selectedVisibilityType={visibilityType}
        />
      </div>
    </div>
  );
}
