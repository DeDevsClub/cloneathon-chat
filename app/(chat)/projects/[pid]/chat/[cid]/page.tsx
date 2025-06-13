import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { use } from 'react';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { Message } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';

interface PageParams {
  pid: string;
  cid: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export default async function ChatPage(props: PageProps) {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const { pid, cid } = unwrappedParams; // ids from URL params

  try {
    const chat = await getChatById({ id: cid });

    if (!chat) {
      notFound();
    }

    const session = await auth();

    if (!session) {
      redirect('/api/auth/guest');
    }

    if (chat.visibility === 'private') {
      if (!session.user) {
        return notFound();
      }

      if (session.user.id !== chat.userId) {
        return notFound();
      }
    }

    const messagesFromDb = await getMessagesByChatId({
      id: cid,
    });

    function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
      return messages.map((message) => ({
        projectId: pid,
        id: message.id,
        parts: message.parts as UIMessage['parts'],
        role: message.role as UIMessage['role'],
        content: '',
        createdAt: message.createdAt,
        experimental_attachments:
          (message.attachments as Array<Attachment>) ?? [],
      }));
    }

    const cookieStore = await cookies();
    const chatModelFromCookie = cookieStore.get('chat-model');

    if (!chatModelFromCookie) {
      return (
        <>
          <Chat
            projectId={pid}
            cid={cid}
            initialMessages={convertToUIMessages(messagesFromDb)}
            initialChatModel={DEFAULT_CHAT_MODEL}
            initialVisibilityType={chat.visibility}
            isReadonly={session?.user?.id !== chat.userId}
            session={session}
            autoResume={true}
          />
          <DataStreamHandler cid={cid} />
        </>
      );
    }

    return (
      <>
        <Chat
          projectId={pid}
          cid={cid}
          initialMessages={convertToUIMessages(messagesFromDb)}
          initialChatModel={chatModelFromCookie.value}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler cid={cid} />
      </>
    );
  } catch (error) {
    console.error('Error loading chat:', error);
    return notFound();
  }
}
