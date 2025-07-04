'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from '../icons';
import { PreviewAttachment } from '@/components/chat/preview-attachment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SuggestedActions } from '@/components/chat/suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from '@/components/visibility-selector';
import { ModelSelector } from './model-selector';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { saveChatModelAsCookie } from '@/app/chats/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { SlashCommandMenu } from './slash-command-menu';
import { useSlashCommands } from '@/hooks/use-slash-commands';
import { Icon } from '@iconify/react';
import { AVAILABLE_MODELS_NAMES } from '@/lib/constants';

function PureMultimodalInput({
  chatId,
  projectId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  toolsEnabled = false,
  onToolsToggle,
  canvasEnabled = false,
  onCanvasToggle,
}: {
  chatId: string;
  projectId: string | null;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  toolsEnabled?: boolean;
  onToolsToggle?: (enabled: boolean) => void;
  canvasEnabled?: boolean;
  onCanvasToggle?: (enabled: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const {
    commands,
    query,
    isVisible,
    selectedIndex,
    activeCommand,
    handleInputChange: handleSlashCommandInputChange,
    handleKeyDown: handleSlashCommandKeyDown,
    selectCommand,
    close: closeSlashCommands,
    setSuggestionCount,
  } = useSlashCommands({
    onClearChat: () => {
      setMessages([]);
      setInput('');
      resetHeight();
      setLocalStorageInput('');
    },
    onToggleWebSearch: () => onToolsToggle?.(!toolsEnabled),
    onToggleImageGeneration: () => onToolsToggle?.(!toolsEnabled),
    onSwitchModel: (modelId) => {
      if (modelId) {
        onModelChange?.(modelId);
      } else {
        // Show available models
        toast.info(`Available models: ${AVAILABLE_MODELS_NAMES.join(', ')}`);
      }
    },
    onToggleTool: (toolId) => {
      if (toolId) {
        // Handle specific tool selection
        switch (toolId) {
          case 'web-search':
            onToolsToggle?.(!toolsEnabled);
            toast.success(
              `Web search ${toolsEnabled ? 'disabled' : 'enabled'}`,
            );
            break;
          case 'image-generation':
            onToolsToggle?.(!toolsEnabled);
            toast.success(
              `Image generation ${toolsEnabled ? 'disabled' : 'enabled'}`,
            );
            break;
          case 'canvas-mode':
            onCanvasToggle?.(!canvasEnabled);
            toast.success(
              `Canvas mode ${canvasEnabled ? 'disabled' : 'enabled'}`,
            );
            break;
          case 'file-upload': {
            // Trigger file upload dialog
            const fileInput = document.querySelector(
              'input[type="file"]',
            ) as HTMLInputElement;
            fileInput?.click();
            break;
          }
          default:
            toast.info(`Tool '${toolId}' functionality coming soon!`);
        }
      } else {
        // Show available tools
        toast.info(
          'Available tools: web-search, image-generation, canvas-mode, file-upload, code-interpreter, artifacts',
        );
      }
    },
  });

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    adjustHeight();

    // Handle slash commands
    const result = handleSlashCommandInputChange(newValue);
    if (result.shouldClear) {
      setInput('');
      resetHeight();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const { data: session } = useSession();
  if (!session) {
    console.error('No session found');
    redirect('/login');
  }
  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, setLocalStorageInput, width]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name);
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleModelChange = (modelId: string) => {
    console.log('Model changed to:', modelId);
    saveChatModelAsCookie(modelId);
    onModelChange?.(modelId);
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      // console.log(
      //   'Selected files:',
      //   files.map((file) => file.name),
      // );
      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );
        // console.log(
        //   'Successfully uploaded attachments:',
        //   successfullyUploadedAttachments,
        // );
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const handleKeyDown = (event: any) => {
    // Handle slash command navigation first
    const commandHandled = handleSlashCommandKeyDown(event);
    if (commandHandled) {
      return;
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      // Allow submission regardless of status to fix streaming issues
      submitForm();
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <Icon icon="mdi:arrow-down" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        commands={commands}
        query={query}
        isVisible={isVisible}
        selectedIndex={selectedIndex}
        activeCommand={activeCommand}
        onSelectCommand={selectCommand}
        onClose={closeSlashCommands}
        onSuggestionCountChange={setSuggestionCount}
      />

      {messages.length === 0 &&
        !isVisible &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder={
          toolsEnabled
            ? 'Enter your message here or type /t for tools'
            : 'Enter your message here or type / for commands'
        }
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={handleKeyDown}
      />

      <div className="absolute bottom-0 p-1 w-fit flex flex-row justify-start bg-background rounded-lg">
        {messages.length >= 0 && (
          <ModelSelector
            session={session}
            selectedModelId={selectedModelId}
            onModelChange={handleModelChange}
          />
        )}

        {/* tool — button - search - globe */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 size-8 transition-colors ${
            toolsEnabled
              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => onToolsToggle?.(!toolsEnabled)}
          disabled={status === 'submitted'}
          title={toolsEnabled ? 'Disable tools' : 'Enable tools'}
        >
          <Icon icon="mdi:tools" width={16} height={16} />
        </Button>

        {/* Canvas button for markdown/code rendering */}
        {/* <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 size-8 transition-colors ${
            canvasEnabled
              ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => onCanvasToggle?.(!canvasEnabled)}
          disabled={status === 'submitted'}
          title={
            canvasEnabled
              ? 'Disable canvas mode'
              : 'Enable canvas for code/markdown'
          }
        >
          <Icon icon="mdi:notebook-outline" width={16} height={16} />
        </Button> */}

        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === 'submitted' ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.onModelChange !== nextProps.onModelChange) return false;
    if (prevProps.toolsEnabled !== nextProps.toolsEnabled) return false;
    if (prevProps.onToolsToggle !== nextProps.onToolsToggle) return false;
    if (prevProps.canvasEnabled !== nextProps.canvasEnabled) return false;
    if (prevProps.onCanvasToggle !== nextProps.onCanvasToggle) return false;
    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
