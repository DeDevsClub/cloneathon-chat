export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  model: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat',
    description: 'Primary model for all-purpose chat',
    model: 'gpt-4o',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning',
    description: 'Advanced reasoning model for complex tasks',
    model: 'gpt-4o',
  },
];
