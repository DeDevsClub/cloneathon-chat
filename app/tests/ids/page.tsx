'use client';

import { useState } from 'react';
import { getProjectForChat, getMessagesForChat } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/lib/db/schema';
import { UIMessage } from 'ai';

function IDsPage() {
  const [chatId, setChatId] = useState('');
  const [projectId, setProjectId] = useState<string | null | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<
    Array<Message | UIMessage> | null | undefined
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchProject = async ({ chatId }: { chatId: string }) => {
    if (!chatId) {
      alert('Please enter a Chat ID.');
      return;
    }
    setIsLoading(true);
    setProjectId(undefined);
    const result = await getProjectForChat(chatId);
    setProjectId(result);
    setIsLoading(false);
  };

  const handleFetchMessagesForChat = async ({
    chatId,
  }: {
    chatId: string;
  }) => {
    if (!chatId) {
      alert('Please enter a Chat ID.');
      return;
    }
    setIsLoading(true);
    setMessages(null);
    const result = await getMessagesForChat({ chatId });
    setMessages(result);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-cols size-full bg-background">
      <h1 className="text-2xl font-bold mb-4">Get Project ID for Chat</h1>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter Chat ID"
          disabled={isLoading}
        />
        <Button
          onClick={() => handleFetchProject({ chatId })}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Project ID'}
        </Button>
      </div>
      {projectId !== undefined && (
        <div className="mt-4 p-4 border rounded-md bg-muted">
          <h2 className="text-lg font-semibold">Result:</h2>
          <p>
            Project ID:{' '}
            {projectId ? (
              <code className="font-mono bg-muted-foreground/20 p-1 rounded">
                {projectId}
              </code>
            ) : (
              'Not found or no project associated.'
            )}
          </p>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Get Messages for Chat</h1>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter Chat ID"
          disabled={isLoading}
        />
        <Button
          onClick={() => handleFetchMessagesForChat({ chatId })}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Messages'}
        </Button>
      </div>
      {messages !== undefined && (
        <div className="mt-4 p-4 border rounded-md bg-muted">
          <h2 className="text-lg font-semibold">Result:</h2>
          <p>
            Messages:{' '}
            {messages ? (
              <code className="font-mono bg-muted-foreground/20 p-1 rounded">
                {JSON.stringify(messages)}
              </code>
            ) : (
              'Not found or no messages associated.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default IDsPage;
