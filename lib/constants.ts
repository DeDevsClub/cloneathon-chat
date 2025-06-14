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
