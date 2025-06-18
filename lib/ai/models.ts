export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'xai' | 'groq';
  contextWindow?: number;
  capabilities?: string[];
}

export const chatModels: Array<ChatModel> = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable OpenAI model with vision and reasoning',
    model: 'gpt-4o',
    provider: 'openai',
    contextWindow: 128000,
    capabilities: ['text', 'vision', 'code'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cheaper version of GPT-4o',
    model: 'gpt-4o-mini',
    provider: 'openai',
    contextWindow: 128000,
    capabilities: ['text', 'vision', 'code'],
  },
  {
    id: 'o1-preview',
    name: 'o1 Preview',
    description: 'Advanced reasoning model for complex problems',
    model: 'o1-preview',
    provider: 'openai',
    contextWindow: 32768,
    capabilities: ['reasoning', 'math', 'science'],
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    description: 'Faster reasoning model for coding and math',
    model: 'o1-mini',
    provider: 'openai',
    contextWindow: 65536,
    capabilities: ['reasoning', 'code', 'math'],
  },

  // Anthropic Models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model with strong reasoning',
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    contextWindow: 200000,
    capabilities: ['text', 'vision', 'code', 'analysis'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and efficient Claude model',
    model: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    contextWindow: 200000,
    capabilities: ['text', 'code'],
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model for complex tasks',
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
    contextWindow: 200000,
    capabilities: ['text', 'vision', 'analysis', 'creative'],
  },

  // xAI Models
  {
    id: 'grok-2-1212',
    name: 'Grok 2',
    description: 'Latest Grok model with real-time information',
    model: 'grok-2-1212',
    provider: 'xai',
    contextWindow: 131072,
    capabilities: ['text', 'realtime', 'web-search'],
  },
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision',
    description: 'Grok model with vision capabilities',
    model: 'grok-2-vision-1212',
    provider: 'xai',
    contextWindow: 131072,
    capabilities: ['text', 'vision', 'realtime'],
  },

  // Groq Models
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    description: 'Ultra-fast Llama model on Groq',
    model: 'llama-3.3-70b-versatile',
    provider: 'groq',
    contextWindow: 131072,
    capabilities: ['text', 'code', 'speed'],
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: 'Lightning-fast smaller Llama model',
    model: 'llama-3.1-8b-instant',
    provider: 'groq',
    contextWindow: 131072,
    capabilities: ['text', 'speed'],
  },
];

// Legacy support - map old model IDs to new ones
export const modelIdMap: Record<string, string> = {
  'chat-model': 'gpt-4o',
  'chat-model-reasoning': 'o1-preview',
  'title-model': 'gpt-4o-mini',
  'artifact-model': 'gpt-4o',
};
