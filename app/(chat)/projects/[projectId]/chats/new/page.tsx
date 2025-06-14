'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { use } from 'react';
import { AppRoutes } from '@/lib/routes';

interface PageParams {
  projectId: string;
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

  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const projectId = unwrappedParams.projectId;

  useEffect(() => {
    async function createNewChat() {
      // Wait for session to load
      if (status === 'loading') return;

      try {
        if (!projectId) {
          toast.error('Project ID is required');
          router.push(AppRoutes.projects.list);
          return;
        }

        if (!session) {
          toast.error('You must be logged in to create a chat');
          // router.push('/login');
          return;
        }

        // Generate a UUID for the new chat
        const chatId = uuidv4();

        // Create initial chat with default title
        const messageContent = 'Hello! This is a new chat.';

        const messageId = uuidv4();
        const payload = {
          id: chatId,
          projectId, // Include projectId in the initial payload
          selectedVisibilityType: 'private',
          selectedChatModel: 'chat-model',
          message: {
            id: messageId,
            content: messageContent,
            parts: [{ text: messageContent, type: 'text' }],
            role: 'user',
            createdAt: new Date().toISOString(),
            experimental_attachments: [],
          },
        };

        console.log('Sending chat creation payload:', payload);

        const response = await fetch(AppRoutes.api.chat.base, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create chat');
        }

        // Now update the chat with the project ID
        const projectUpdateResponse = await fetch(AppRoutes.api.chat.project, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            projectId,
          }),
        });

        if (!projectUpdateResponse.ok) {
          throw new Error(
            `Failed to associate chat with project: ${projectUpdateResponse.status} ${projectUpdateResponse.statusText}`,
          );
        }

        // Redirect to the new chat
        router.push(AppRoutes.chats.projectChat.detail(projectId, chatId));
      } catch (error: unknown) {
        console.error('Error creating chat:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to create chat: ${errorMessage}`);
        router.push(AppRoutes.projects.detail(projectId));
      } finally {
        setCreating(false);
      }
    }

    createNewChat();
  }, [projectId, router, session, status]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Creating a new chat...</p>
      </div>
    </div>
  );
}
