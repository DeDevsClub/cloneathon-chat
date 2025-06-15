'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getChatHistoryEndpoint } from '@/lib/routes';

export interface ChatHistoryMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
}

export interface ChatHistoryResponse {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  projectId: string | null;
  messageCount: number;
  messages: ChatHistoryMessage[];
}

/**
 * Custom hook for fetching chat history
 * @param chatId The ID of the chat to fetch history for
 * @returns Object containing chat history data and loading state
 */
export function useChatHistory(chatId: string | null) {
  const [error, setError] = useState<string | null>(null);

  // Only fetch if chatId is provided
  const { data, isLoading, mutate } = useSWR<ChatHistoryResponse>(
    chatId ? getChatHistoryEndpoint(chatId) : null,
    async (url: URL) => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch chat history');
        }

        return response.json();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      }
    },
  );

  return {
    history: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Example usage:
 *
 * import { useChatHistory } from '@/lib/hooks/useChatHistory';
 *
 * function ChatHistoryView({ chatId }) {
 *   const { history, isLoading, error } = useChatHistory(chatId);
 *
 *   if (isLoading) return <div>Loading chat history...</div>;
 *   if (error) return <div>Error loading history: {error}</div>;
 *
 *   return (
 *     <div>
 *       <h2>{history.title}</h2>
 *       <p>Total messages: {history.messageCount}</p>
 *       <div className="messages">
 *         {history.messages.map(message => (
 *           <div key={message.id} className={`message ${message.role}`}>
 *             <p>{message.content}</p>
 *             <small>{new Date(message.createdAt).toLocaleString()}</small>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
