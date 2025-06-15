'use client';

import { useState } from 'react';
import {
  getProjectForChat,
  getMessagesForChat,
  getChatsForUser,
} from '@/app/chats/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chat, Message } from '@/lib/db/schema';
import { UIMessage } from 'ai';

function IDsPage() {
  const [chatId, setChatId] = useState('');
  const [projectId, setProjectId] = useState<string | null | undefined>(
    undefined,
  );
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<
    Array<Message | UIMessage> | null | undefined
  >(null);
  const [userChats, setUserChats] = useState<Array<Chat> | null | undefined>(
    null,
  );
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

  const handleFetchMessagesForUser = async ({
    userId,
  }: {
    userId: string;
  }) => {
    if (!userId) {
      alert('Please enter a User ID.');
      return;
    }
    setIsLoading(true);
    setUserChats(null);
    const result = await getChatsForUser({ userId });
    setUserChats(result?.chats);
    setIsLoading(false);
  };
  return (
    <div className="grid grid-col gap-2 size-full bg-neutral-950">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter Chat ID"
          disabled={isLoading}
          className="bg-neutral-700 text-neutral-200"
        />
        <Button
          onClick={() => handleFetchProject({ chatId })}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Project ID'}
        </Button>
      </div>

      <div className="flex h-24 w-full justify-center items-center text-center bg-slate-950">
        Project ID:{' '}
        {projectId ? (
          <code className="font-mono bg-neutral-200 p-1 rounded">
            {projectId}
          </code>
        ) : (
          'Not found or no project associated.'
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter Chat ID"
          disabled={isLoading}
          className="bg-neutral-700 text-neutral-200"
        />
        <Button
          onClick={() => handleFetchMessagesForChat({ chatId })}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Messages'}
        </Button>
      </div>
      <div className="border rounded-md bg-neutral-950">
        <div>
          Messages:{' '}
          {messages ? (
            <code className="font-mono bg-neutral-200 p-1 rounded">
              {JSON.stringify(messages)}
            </code>
          ) : (
            'Not found or no messages associated.'
          )}
        </div>
      </div>

      {/* USER ID */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          disabled={isLoading}
          className="bg-neutral-700 text-neutral-200"
        />
        <Button
          onClick={() => handleFetchMessagesForUser({ userId })}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Messages'}
        </Button>
      </div>
      <div className="border rounded-md bg-neutral-950">
        <div>
          {userChats ? (
            userChats.length > 0 ? (
              <div className="space-y-4">
                {userChats?.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 border rounded-md bg-neutral-900 border-neutral-700"
                  >
                    <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                      Chat ID:{' '}
                      <code className="font-mono text-sm bg-neutral-700 text-neutral-300 p-1 rounded">
                        {chat.id}
                      </code>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-neutral-300">
                      <p>
                        <span className="font-medium text-neutral-400">
                          Title:
                        </span>{' '}
                        {chat.title || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-400">
                          Model:
                        </span>{' '}
                        {chat.model || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-400">
                          Visibility:
                        </span>{' '}
                        {chat.visibility || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-400">
                          Project ID:
                        </span>{' '}
                        {chat.projectId || 'N/A'}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-medium text-neutral-400">
                          System Prompt:
                        </span>
                        <span className="block mt-1 p-2 bg-neutral-800 rounded text-xs whitespace-pre-wrap">
                          {chat.systemPrompt || 'N/A'}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-neutral-400">
                          Created At:
                        </span>{' '}
                        {chat.createdAt
                          ? new Date(chat.createdAt).toLocaleString()
                          : 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-400">
                          Last Activity:
                        </span>{' '}
                        {chat.lastActivityAt
                          ? new Date(chat.lastActivityAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">No chats found for this user.</p>
            )
          ) : (
            <p className="text-neutral-400">
              Not found or no messages associated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default IDsPage;
