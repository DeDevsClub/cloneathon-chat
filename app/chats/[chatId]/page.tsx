'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { Chat } from '@/components/chat/chat';
import type { UIMessage } from 'ai';
import { getMessagesForChat } from '@/app/chats/actions';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { MobileHeader } from '@/components/chat/mobile-header';
import { DEFAULT_VISIBILITY_TYPE } from '@/lib/constants';

type PageProps = {
  params: Promise<{
    chatId: string;
    projectId?: string;
  }>;
};

export default function ChatPage(props: PageProps) {
  const unwrappedParams = use(props.params);
  const chatId = unwrappedParams.chatId;
  const projectId = unwrappedParams.projectId;
  const { data: session } = useSession();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);

  if (!session) {
    console.error('No session found');
    redirect('/login');
  }

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const messages = await getMessagesForChat({ chatId });
        // console.log('Raw messages from database:', messages);
        if (messages) {
          // Convert database messages to UI messages format
          const uiMessages: UIMessage[] = messages.map((msg) => {
            // Extract content from either textContent or parts
            let content = msg.textContent || '';

            // If no textContent, try to extract from parts
            if (!content && Array.isArray(msg.parts)) {
              const textParts = msg.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join(' ');
              content = textParts;
            }

            console.log(
              `Message ${msg.id}: role=${msg.role}, textContent="${msg.textContent}", content="${content}", parts=`,
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
        setInitialMessages(initialMessages);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId]);

  // Load selected model from cookies on client side
  useEffect(() => {
    const getModelFromCookies = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const modelCookie = cookies.find((cookie) =>
          cookie.trim().startsWith('chat-model='),
        );
        if (modelCookie) {
          const model = modelCookie.split('=')[1];
          setSelectedModel(model || DEFAULT_CHAT_MODEL);
        }
      }
    };
    getModelFromCookies();
  }, []);

  // Show loading state while fetching messages
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-lg text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileHeader chatId={chatId} />
      <div className="pt-4 md:pt-0">
        <Chat
          projectId={projectId || null}
          chatId={chatId}
          initialMessages={initialMessages || []}
          initialChatModel={selectedModel || DEFAULT_CHAT_MODEL}
          initialVisibilityType={DEFAULT_VISIBILITY_TYPE}
          isReadonly={false}
          session={session as Session}
          autoResume={true}
        />
      </div>
    </>
  );
}
