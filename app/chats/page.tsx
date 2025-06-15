'use client';

import { use } from 'react';
import { Chat } from '@/components/chat/chat';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { redirect } from 'next/navigation';
interface PageParams {
  chatId: string;
  projectId: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export default function ChatsPage(props: PageProps) {
  const unwrappedParams = use(props.params);
  const chatId = unwrappedParams.chatId;
  const projectId = unwrappedParams.projectId;
  const { data: session } = useSession();

  if (!session) {
    console.error('No session found');
    redirect('/login');
  }

  return (
    <div className="flex flex-cols">
      <Chat
        projectId={projectId}
        chatId={chatId}
        initialMessages={[]}
        initialChatModel="chat-model"
        initialVisibilityType="private"
        isReadonly={false}
        session={session as Session}
        autoResume={true}
      />
    </div>
  );
}
