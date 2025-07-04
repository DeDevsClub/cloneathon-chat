'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr'; // useSWR removed as unused
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils'; // fetcher removed as unused
import { Artifact, type UIArtifact } from '@/components/chat/artifact'; // Added UIArtifact import
import { Messages } from '@/components/chat/messages';
import type { VisibilityType } from '@/components/visibility-selector'; // Restored VisibilityType import
import { useArtifactSelector } from '@/hooks/use-artifact'; // Restored useArtifactSelector and corrected path
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/components/navigation/sidebar-history';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { useTokenUsage } from '@/hooks/use-token-usage';

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

  // Track current model
  const [currentModel, setCurrentModel] = useState(initialChatModel);

  // Track tools enabled state
  const [toolsEnabled, setToolsEnabled] = useState(false);

  // Track canvas mode state
  const [canvasEnabled, setCanvasEnabled] = useState(false);

  // Handle model change
  const handleModelChange = (modelId: string) => {
    console.log('Chat component: Model changed to:', modelId);
    setCurrentModel(modelId);
  };

  // Handle tools toggle
  const handleToolsToggle = (enabled: boolean) => {
    console.log('Chat component: Tools enabled:', enabled);
    setToolsEnabled(enabled);
  };

  // Handle canvas mode toggle
  const handleCanvasToggle = (enabled: boolean) => {
    console.log('Chat component: Canvas mode enabled:', enabled);
    setCanvasEnabled(enabled);
  };

  const { visibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType,
  });

  const { storeUsage, getUsage } = useTokenUsage();
  const {
    error,
    input,
    status,
    handleInputChange,

    handleSubmit,
    messages,
    reload,
    stop,
    experimental_resume,
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
    api: `/api/chats`,

    onFinish(message, { usage, finishReason }) {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      console.log('Usage', usage);
      console.log('FinishReason', finishReason);

      // Store usage data for the message
      if (usage && message.id) {
        storeUsage(message.id, {
          promptTokens: usage.promptTokens || 0,
          completionTokens: usage.completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
        });
      }
    },
    experimental_prepareRequestBody: (body) => {
      console.log('Preparing request body with projectId:', projectId);
      console.log('Using model:', currentModel);
      console.log('Tools enabled:', toolsEnabled);
      console.log('Canvas mode enabled:', canvasEnabled);
      console.log('Chat request body:', JSON.stringify(body, null, 2));
      // Send the messages array directly as expected by the OpenAI API
      return {
        ...body, // Keep all original properties
        projectId: projectId || null,
        // chatId: chatId,
        // messages: body.messages,
        selectedChatModel: currentModel || 'chat-model',
        selectedVisibilityType: visibilityType,
        toolsEnabled: toolsEnabled,
        forceArtifactModel: canvasEnabled,
      };
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
      window.history.replaceState({}, '', `/chats/${chatId}`);
    }
  }, [hasAppendedQuery, status, input, messages, chatId]);
  // hasAppendedQuery,
  // status,
  // input,
  // messages,
  // chatId,
  // projectId,
  // visibilityType,
  // toolsEnabled,
  // canvasEnabled,
  // currentModel,
  // session,
  // append,
  // query,

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
    <div className="flex flex-col w-full min-w-full h-dvh justify-center scrollbar-transparent">
      <Messages
        chatId={chatId}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        isArtifactVisible={isArtifactVisible}
        getUsage={getUsage}
      />

      <div className="flex p-2 max-w-full justify-center dark:bg-slate-950/50 bg-slate-50">
        {/* <div className="flex flex-col w-[calc(100vw-1rem)] px-2 py-1 max-w-full items-center justify-center dark:bg-slate-950/50 bg-background"> */}
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
            selectedVisibilityType={visibilityType || 'private'}
            selectedModelId={currentModel}
            onModelChange={handleModelChange}
            toolsEnabled={toolsEnabled}
            onToolsToggle={handleToolsToggle}
            canvasEnabled={canvasEnabled}
            onCanvasToggle={handleCanvasToggle}
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
          isReadonly={isReadonly || false}
          selectedVisibilityType={visibilityType || 'private'}
          selectedModelId={currentModel}
        />
      </div>
    </div>
  );
}
