'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';
import { Greeting } from '@/components/chat/greeting';
import { Chat } from '@/components/chat/chat';
import { MobileHeader } from '@/components/chat/mobile-header';
import { ModelSelector } from '@/components/chat/model-selector';
import { DEFAULT_VISIBILITY_TYPE } from '@/lib/constants';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { UIMessage } from 'ai';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

const ChatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);

  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>();

  // Generate stable chatId that doesn't change on re-renders
  const [chatId] = useState(() => uuidv4());

  if (!session) {
    console.error('No session found');
    redirect('/login');
  }

  // Load saved model from cookies on component mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const modelCookie = cookies.find((cookie) =>
        cookie.trim().startsWith('model='),
      );
      if (modelCookie) {
        const savedModel = modelCookie.split('=')[1];
        setSelectedModel(savedModel);
      }
    }
  }, []);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        // For new chats on the main /chats page, we start with empty messages
        console.log('Converted UI messages:', []);
        setInitialMessages([]);
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Continue with empty messages if loading fails
        setInitialMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  const fetchChats = async () => {
    console.log('Fetching chats...');
    try {
      setLoading(true);
      const response = await fetch('/api/chats/history', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.email}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.status}`);
      }

      const data = await response.json();
      console.log({ data });
      setChats(data?.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // return;
  useEffect(() => {
    if (!session) {
      console.log('No session found');
      setLoading(false);
    } else {
      fetchChats();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // Check if the click originated from within the HeaderIsland to prevent immediate closure
        const headerIslandElement = document.querySelector(
          '.pointer-events-none.fixed.inset-x-0.top-0',
        );
        if (headerIslandElement?.contains(event.target as Node)) {
          // Check if the actual click target is the toggle button itself or its child icon
          // This is a bit of a heuristic. A more robust way would be to pass a ref for the toggle button.
          let targetElement = event.target as HTMLElement;
          let isToggleButton = false;
          while (targetElement && targetElement !== headerIslandElement) {
            if (targetElement.getAttribute('aria-label') === 'Toggle sidebar') {
              isToggleButton = true;
              break;
            }
            targetElement = targetElement.parentElement as HTMLElement;
          }
          if (isToggleButton) return; // Don't close if toggle button was clicked
        }
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    toast.success(`Selected ${modelId} model`);
  };

  return (
    <div className="container w-screen h-screen sm:max-w-[calc(100vw-1rem)] py-0 mx-auto overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon
            icon="lucide:loader"
            className="size-8 animate-spin text-primary"
          />
        </div>
      ) : (
        <>
          <MobileHeader chatId={chatId} />
          <div className="pt-16 md:pt-0">
            {!selectedModel ? (
              <ModelSelectionScreen 
                session={session as Session}
                onModelSelect={handleModelChange}
              />
            ) : (
              <Chat
                projectId={null}
                chatId={chatId}
                initialMessages={initialMessages}
                initialChatModel={selectedModel}
                initialVisibilityType={DEFAULT_VISIBILITY_TYPE}
                isReadonly={false}
                session={session as Session}
                autoResume={true}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Model selection screen component
const ModelSelectionScreen = ({ 
  session, 
  onModelSelect 
}: { 
  session: Session; 
  onModelSelect: (modelId: string) => void; 
}) => {
  const [tempSelectedModel, setTempSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);

  const handleConfirmSelection = () => {
    if (tempSelectedModel) {
      onModelSelect(tempSelectedModel);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-8 px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold text-foreground">
          Choose Your AI Model
        </h1>
        <p className="text-muted-foreground text-lg">
          Select an AI model to start your conversation. Each model has different capabilities and strengths.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <span className="text-sm font-medium text-foreground">
            Select Model:
          </span>
          <ModelSelector
            session={session}
            selectedModelId={tempSelectedModel}
            onModelChange={setTempSelectedModel}
            className="min-w-[200px]"
          />
        </div>

        <button
          type="button"
          onClick={handleConfirmSelection}
          disabled={!tempSelectedModel}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Chatting
        </button>
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <div className="flex flex-col w-full max-w-screen h-screen max-h-screen justify-center items-center overflow-hidden">
      <Greeting />
      <Link href="/chats/new" className="welcome-button">
        Chat with AI Agents
      </Link>
    </div>
  );
};

export default ChatsPage;
