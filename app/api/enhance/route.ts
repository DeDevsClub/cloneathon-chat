import { SYSTEM_PROMPT } from '@/lib/ai/constants';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// This is a simplified example. In a real application, you would:
// 1. Securely manage the OpenAI API key (e.g., environment variables on the server, or a dedicated API key management system).
// 2. Implement more sophisticated error handling and input validation.
// 3. Customize the prompt and model parameters based on the specific enhancement logic from your frontend.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, apiKey } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 },
      );
    }

    if (typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input must be a string' },
        { status: 400 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 },
      );
    }

    if (typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'OpenAI API key must be a string' },
        { status: 400 },
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${text}` },
      ],
      // Add other parameters like temperature, max_tokens as needed
    });

    const aiResponseContent = completion.choices[0]?.message?.content?.trim();

    if (!aiResponseContent) {
      return NextResponse.json(
        { error: 'Failed to get content from OpenAI' },
        { status: 500 },
      );
    }

    try {
      const parsedAiResponse = JSON.parse(aiResponseContent);
      const actualEnhancedPrompt = parsedAiResponse.enhancedPrompt;

      if (typeof actualEnhancedPrompt === 'string') {
        return NextResponse.json({ enhancedText: actualEnhancedPrompt.trim() });
      } else {
        console.error(
          "OpenAI response's 'enhancedPrompt' field was not a string or was missing:",
          parsedAiResponse,
        );
        return NextResponse.json(
          {
            error:
              "OpenAI response did not contain a valid 'enhancedPrompt' string field",
          },
          { status: 500 },
        );
      }
    } catch (parseError) {
      // This catch block handles errors if aiResponseContent is not valid JSON.
      // This might happen if the AI, despite the system prompt, doesn't return JSON.
      // In this specific case, the SYSTEM_PROMPT asks for JSON with 'enhancedPrompt' and 'notes'.
      // If we don't get that, it's an unexpected format.
      console.error(
        "Failed to parse AI's JSON response or 'enhancedPrompt' was invalid:",
        parseError,
      );
      console.error('AI raw response content:', aiResponseContent);
      return NextResponse.json(
        {
          error: 'OpenAI returned an unexpected response format.',
          details: "Expected JSON with 'enhancedPrompt' field.",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('API Error in /api/enhance:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Handle OpenAI API specific errors
    // Note: OpenAI's SDK might throw errors with specific structures.
    // Adjust based on the actual error objects thrown by the version of 'openai' package you are using.
    if (error.response) {
      // Axios-like error structure from older SDK versions or direct fetch
      console.error('OpenAI API Error Status:', error.response.status);
      console.error('OpenAI API Error Data:', error.response.data);
      return NextResponse.json(
        { error: 'OpenAI API error', details: error.response.data },
        { status: error.response.status },
      );
    } else if (error.status && error.error) {
      // Newer OpenAI SDK error structure
      console.error('OpenAI API Error Status:', error.status);
      console.error('OpenAI API Error Data:', error.error);
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          details: error.error.message || 'Unknown OpenAI error',
        },
        { status: error.status },
      );
    }

    // General server error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred on the server.',
        details: error.message || 'No additional details',
      },
      { status: 500 },
    );
  }
}
