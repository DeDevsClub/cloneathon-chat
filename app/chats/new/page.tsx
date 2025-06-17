'use client';

import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { AppRoutes } from '@/lib/routes';
import { PAGE_SIZE } from '@/components/navigation/sidebar-history';
import {
  DEFAULT_CHAT_MESSAGE,
  DEFAULT_CHAT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
} from '@/lib/constants';
import { MobileHeader } from '@/components/chat/mobile-header';

type ErrorMessage = {
  message: string;
};

/**
 * This page handles the creation of a new chat within a project.
 * It generates a UUID for the chat, creates the chat record in the database,
 * and redirects to the new chat page.
 */

export default function NewChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [creating, setCreating] = useState(true);

  // Get projectId from search parameters
  const projectId = searchParams.get('projectId');
  const systemPrompt = DEFAULT_SYSTEM_PROMPT;
  const chatModel = 'chat-model';

  useEffect(() => {
    async function createNewChat() {
      // Wait for session to load
      if (status === 'loading') return;

      try {
        if (!session) {
          toast.error('Must be logged in to create a chat.');
          router.push('/login');
          return;
        }

        // Generate a UUID for the new chat
        const chatId = uuidv4();

        const messageId = uuidv4();
        const message = {
          id: messageId,
          content: DEFAULT_CHAT_MESSAGE,
          parts: [
            {
              text: DEFAULT_CHAT_MESSAGE,
              type: 'text',
            },
          ],
          role: 'user',
          createdAt: new Date().toISOString(),
          experimental_attachments: [],
          model: chatModel || DEFAULT_CHAT_MODEL,
          projectId: projectId || null,
          contentType: 'application/vnd.ai.content.v1+json',
          textContent: DEFAULT_CHAT_MESSAGE,
        };

        const payload = {
          id: chatId,
          system: systemPrompt,
          visibility: 'private',
          selectedChatModel: chatModel || DEFAULT_CHAT_MODEL,
          messages: [message],
          project: projectId ? { id: projectId } : null,
          contentType: 'application/vnd.ai.content.v1+json',
          textContent: message.textContent || DEFAULT_CHAT_MESSAGE,
        };

        console.log('Creating chat with payload:', payload);

        const response = await fetch(AppRoutes.api.chats.base, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          let errorMessage = 'Failed to create chat';

          // Handle specific chat limit errors
          if (errorData?.message) {
            if (errorData.message.includes('maximum number of chats allowed')) {
              errorMessage = errorData.message;
              toast.error(errorMessage, {
                duration: 6000,
                action: {
                  label: 'Manage Chats',
                  onClick: () => router.push(AppRoutes.chats.list()),
                },
              });
              router.push(AppRoutes.chats.list());
              return;
            } else {
              errorMessage = errorData.message;
            }
          }

          throw new Error(errorMessage);
        }

        // Redirect to the new chat
        router.push(AppRoutes.chats.detail(chatId));
        // Revalidate the first page of chat history to update the sidebar
        mutate(`/api/chats/history?limit=${PAGE_SIZE}&offset=0`);
      } catch (error: unknown) {
        console.error('Error creating chat:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to create chat: ${errorMessage}`);
        router.push(AppRoutes.chats.list());
      } finally {
        setCreating(false);
      }
    }

    createNewChat();
  }, [router, session, status, projectId, systemPrompt]);

  return (
    <>
      <MobileHeader showBackButton={false} />
      <div className="flex min-h-[60vh] flex-col items-center justify-center pt-16 md:pt-0">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Creating a new chat...
          </p>
          {projectId && (
            <p className="text-sm text-muted-foreground">
              Creating chat in project...
            </p>
          )}
        </div>
      </div>
    </>
  );
}
