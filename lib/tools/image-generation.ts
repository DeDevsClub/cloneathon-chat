import { tool } from 'ai';
import { z } from 'zod';

export const imageGenerationTool = tool({
  description: 'Generate an image based on a text description using DALL-E',
  parameters: z.object({
    prompt: z.string().describe('A detailed description of the image to generate'),
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional().describe('Size of the generated image'),
    quality: z.enum(['standard', 'hd']).optional().describe('Quality of the generated image'),
  }),
  execute: async ({ prompt, size = '1024x1024', quality = 'standard' }) => {
    try {
      // Use DALL-E 3 via OpenAI API
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: size,
          quality: quality,
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E API');
      }

      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        size: size,
        quality: quality,
        message: `Generated image for: "${prompt}"`,
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to generate image',
      };
    }
  },
});
