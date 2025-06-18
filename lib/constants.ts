import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const SYSTEM_PROMPT = `You are a prompt engineering expert. Analyze the user's prompt and provide an enhanced version that will produce better results.

Return your response in the following JSON format:
{
  "enhancedPrompt": "The improved prompt text",
  "notes": ["Note 1 about what was improved", "Note 2 about what was improved", ...]
}

Focus on making these improvements:
1. Add more specificity and detail
2. Clarify ambiguous instructions
3. Improve structure and organization
4. Add constraints and requirements
5. Specify the desired format and style
6. Remove unnecessary words or redundancies

Your response must be valid JSON.`;

export const ORIGINAL_TEXT = 'Original text';

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Your goal is to provide accurate, clear, and concise responses to queries. 
If you do not know the answer to a question, it is better to state that you do not know rather than providing potentially incorrect information. 
Be polite and respectful in all your interactions.`;

/**
 * Application-wide constants
 * Centralizing these values helps maintain consistency across the codebase
 */

// Chat model defaults
export const DEFAULT_CHAT_MESSAGE = 'Hello';

// Default visibility
export const DEFAULT_VISIBILITY_TYPE = 'private';

// API endpoints and paths
export const API_PATHS = {
  CHATS: '/api/chats',
  PROJECTS: '/api/projects',
  DEBUG: '/api/debug',
};

// URL paths
export const URL_PATHS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  PROJECTS: '/projects',
  CHATS: '/chats',
};

// Default pagination limits
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Chat limits per user
export const CHAT_LIMITS = {
  MAX_CHATS_PER_USER: 30, // Maximum number of chats per user
  MAX_CHATS_PER_PROJECT: 15, // Maximum chats per project
};

// Error messages for chat limits
export const CHAT_LIMIT_ERRORS = {
  MAX_CHATS_EXCEEDED:
    'You have reached the maximum number of chats allowed (30). Please delete some chats before creating new ones.',
  MAX_PROJECT_CHATS_EXCEEDED:
    'This project has reached the maximum number of chats allowed (15). Please delete some chats before creating new ones.',
};

export const AVAILABLE_MODELS_NAMES = ['chat-model', 'chat-model-reasoning'];

export const DEFAULT_MODEL = 'xai/grok-3-beta';

export const SUPPORTED_MODELS = [
  // xAI models
  'xai/grok-3-beta',

  // Bedrock Nova models (AWS's cost-effective options)
  'bedrock/amazon.nova-lite-v1:0',
  'bedrock/amazon.nova-micro-v1:0',

  // OpenAI cost-effective options
  'openai/gpt-4o-mini',
  'openai/gpt-3.5-turbo',

  // Anthropic affordable option
  'anthropic/claude-3-haiku',

  // Google cost-effective models
  'vertex/gemini-2.0-flash-001',

  // Groq (known for fast, affordable inference)
  'groq/llama-3.1-8b',
  'groq/gemma2-9b-it',

  // Mistral affordable models
  'mistral/ministral-8b-latest',
  'mistral/ministral-3b-latest',
];
