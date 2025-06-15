import { tool } from 'ai';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../constants';

export const enhancePrompt = tool({
  description: 'Enhance Prompt',
  parameters: z.object({
    originalPrompt: z.string(),
    apiKey: z.string(),
  }),
  execute: async ({ originalPrompt, apiKey }) => {
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: originalPrompt,
          },
        ],
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(content);
      console.log({ parsedResponse });
      return parsedResponse.enhancedPrompt;
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error(
        'Failed to parse the enhancement response. Please try again.',
      );
    }
  },
});
