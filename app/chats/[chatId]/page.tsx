'use client';

import { use } from 'react';
import { Chat } from '@/components/chat/chat';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { UIMessage } from 'ai';
interface PageParams {
  chatId: string;
  projectId: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

enum role {
  user = 'user',
  assistant = 'assistant',
  system = 'system',
}

export default function ChatPage(props: PageProps) {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const chatId = unwrappedParams.chatId;
  const projectId = unwrappedParams.projectId;
  const { data: session } = useSession();
  if (!session) {
    console.error('No session found');
    redirect('/login');
  }

  // Use a default welcome message if no chat data is available yet
  const defaultMessage: UIMessage = {
    id: generateUUID(),
    content: 'Hello! This is a new chat.',
    parts: [{ text: 'Hello! This is a new chat.', type: 'text' }],
    role: role.user,
    createdAt: new Date(),
    experimental_attachments: [],
  };

  return (
    <Chat
      projectId={projectId}
      chatId={chatId}
      initialMessages={[defaultMessage as UIMessage]}
      initialChatModel="chat-model"
      initialVisibilityType="private"
      isReadonly={false}
      session={session as Session}
      autoResume={true}
    />
  );
}
