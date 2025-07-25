import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account - Basic models
   */
  guest: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // Legacy support
      'chat-model',
      'chat-model-reasoning',
      // OpenAI models
      'gpt-4o-mini',
      'gpt-4o',
      // Groq models (fast and free)
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
    ],
  },

  /*
   * For users with an account - All models
   */
  regular: {
    maxMessagesPerDay: 250,
    availableChatModelIds: [
      // Legacy support
      'chat-model',
      'chat-model-reasoning',
      // OpenAI models
      'gpt-4o-mini',
      'gpt-4o',
      'o1-preview',
      'o1-mini',
      // xAI models
      'grok-2-1212',
      'grok-2-vision-1212',
      // Groq models
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
