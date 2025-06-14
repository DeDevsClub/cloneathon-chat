'use client';

import { use } from 'react';
import { Chat } from '@/components/chat/chat';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface PageParams {
  chatId: string;
  projectId: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export default function ChatPage(props: PageProps) {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const chatId = unwrappedParams.chatId; // Safe to access directly since we've properly typed it
  const projectId = unwrappedParams.projectId;
  const { data: session } = useSession();
  if (!session) {
    redirect('/login');
  }
  console.log('Chat ID:', chatId);
  console.log('Project ID:', projectId);

  return (
    <Chat
      projectId={projectId}
      chatId={chatId}
      initialMessages={[
        {
          id: '1',
          content: 'Hello! This is a new chat.',
          parts: [{ text: 'Hello! This is a new chat.', type: 'text' }],
          role: 'user',
          createdAt: new Date(),
          experimental_attachments: [],
        },
      ]}
      initialChatModel=""
      initialVisibilityType="private"
      isReadonly={false}
      session={session}
      autoResume={false}
    />
  );
}
