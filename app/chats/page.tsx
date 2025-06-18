'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';
import { Greeting } from '@/components/chat/greeting';
import { Chat } from '@/components/chat/chat';
import { MobileHeader } from '@/components/chat/mobile-header';
import { DEFAULT_CHAT_MODEL, DEFAULT_VISIBILITY_TYPE } from '@/lib/constants';
import { UIMessage } from 'ai';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

const ChatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);

  if (!session) {
    console.error('No session found');
    redirect('/login');
  }

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const messages = [] as UIMessage[];
        console.log('Raw messages from database:', messages);
        if (messages) {
          // Convert database messages to UI messages format
          const uiMessages: UIMessage[] = messages.map((msg) => {
            // Extract content from either textContent or parts
            let content = msg.content || '';

            // If no textContent, try to extract from parts
            if (!content && Array.isArray(msg.parts)) {
              const textParts = msg.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join(' ');
              content = textParts;
            }

            console.log(
              `Message ${msg.id}: role=${msg.role}, content="${content}", parts=`,
              msg.parts,
            );

            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: content,
              parts: Array.isArray(msg.parts) ? msg.parts : [],
              createdAt: msg.createdAt,
            };
          });
          console.log('Converted UI messages:', uiMessages);
          setInitialMessages(uiMessages);
        }
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
  }, [session, fetchChats]);

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
          <MobileHeader chatId={uuidv4()} />
          <div className="pt-4 md:pt-0">
            <Chat
              projectId={null}
              chatId={uuidv4()}
              initialMessages={initialMessages || []}
              initialChatModel={selectedModel || DEFAULT_CHAT_MODEL}
              initialVisibilityType={DEFAULT_VISIBILITY_TYPE}
              isReadonly={false}
              session={session as Session}
              autoResume={true}
            />
          </div>
        </>
      )}
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
