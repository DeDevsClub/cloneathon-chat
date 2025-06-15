'use client';

import React, { use, useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { AppRoutes } from '@/lib/routes';
import { PAGE_SIZE } from '@/components/navigation/sidebar-history';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants';

interface PageParams {
  projectId?: string;
  systemPrompt?: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

type ErrorMessage = {
  message: string;
};

/**
 * This page handles the creation of a new chat within a project.
 * It generates a UUID for the chat, creates the chat record in the database,
 * and redirects to the new chat page.
 */

export default function NewChatPage(props: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [creating, setCreating] = useState(true);

  // props.params is a Promise, unwrap it with React.use()
  const params = use(props.params);
  const projectId = params.projectId;
  const systemPrompt = params.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  // console.log({ systemPrompt });
  useEffect(() => {
    async function createNewChat() {
      // Wait for session to load
      if (status === 'loading') return;

      try {
        // if (!projectId) {
        //   toast.error('Project ID is required');
        //   router.push(AppRoutes.projects.list);
        //   return;
        // }

        if (!session) {
          toast.error('You must be logged in to create a chat');
          router.push('/login');
          return;
        }

        // Generate a UUID for the new chat
        const chatId = uuidv4();

        // Create initial chat with default title
        const messageContent = 'Hello! This is a new chat.';

        const messageId = uuidv4(); // `msg-${uuidv4()}`;
        const message = {
          id: messageId,
          content: messageContent,
          parts: [
            {
              text: messageContent,
              type: 'text',
            },
          ],
          role: 'user',
          createdAt: new Date().toISOString(),
          experimental_attachments: [],
          model: 'chat-model', // Ensure model is part of the message if needed by backend
          projectId: projectId || null,
          contentType: 'application/vnd.ai.content.v1+json',
          textContent: messageContent,
        };
        const payload = {
          id: chatId,
          system: systemPrompt,
          // Don't include projectId in initial payload to avoid validation issues
          visibility: 'private',
          selectedChatModel: 'chat-model',
          messages: [message],
          projectId: projectId || null,
          // contentType: 'application/vnd.ai.content.v1+json',
          // textContent: messageContent,
        };
        console.log({ payload });
        // console.log('Preparing chat creation payload:', payload);

        const response = await fetch(AppRoutes.api.chats.base, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        // console.log({ response });
        if (!response.ok) {
          throw new Error('Failed to create chat');
        }

        // Now update the chat with the project ID (conditional)
        if (projectId) {
          // console.log('Updating chat with project ID: %s', projectId);
          const projectUpdateResponse = await fetch(
            `${AppRoutes.api.chats.base}/${chatId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${session?.user?.email}`,
              },
              body: JSON.stringify({
                chatId,
                projectId,
              }),
            },
          );

          if (!projectUpdateResponse.ok) {
            throw new Error(
              `Failed to associate chat with project: ${projectUpdateResponse.status} ${projectUpdateResponse.statusText}`,
            );
          }
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
  }, [router, session, status, projectId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Creating a new chat...</p>
      </div>
    </div>
  );
}
