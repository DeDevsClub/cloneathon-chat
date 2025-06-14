import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);
    
    // For streaming responses, we need to return the response directly
    // Check if this is a streaming response (text/plain or text/event-stream)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/plain') || contentType?.includes('text/event-stream')) {
      if (!response.ok) {
        console.error('Error in streaming response:', response.status, response.statusText);
        throw new ChatSDKError('bad_request:api', `HTTP error ${response.status}`);
      }
      return response;
    }
    
    // For non-streaming responses, we can check the response body
    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText);
      try {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        const code = errorData.code || 'bad_request:api';
        throw new ChatSDKError(code, errorData.cause || errorData.message || 'Unknown error');
      } catch (jsonError) {
        // If we can't parse the error as JSON, just throw a generic error
        throw new ChatSDKError('bad_request:api', `HTTP error ${response.status}`);
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof ChatSDKError) {
      throw error;
    }

    // Convert unknown error to string for the error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ChatSDKError('bad_request:api', errorMessage);
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}
