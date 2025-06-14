import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  console.log('🔄 AI API request received');

  try {
    // Parse the request body
    const body = await req.json();
    console.log('📝 Request body:', body);
    function getModel(model: string) {
      if (model === 'chat-model') {
        return 'gpt-4o';
      } else if (model === 'chat-model-reasoning') {
        return 'o4-mini';
      } else {
        return 'gpt-4o';
      }
    }
    // The chat component sends a different format - it sends the full messages array
    // but also prepares a custom format with the last message, projectId, etc.
    const messages = body.messages || [];
    const model = getModel(body.selectedChatModel || body.model || 'gpt-4o');

    console.log('📝 Extracted data:', {
      messageCount: messages.length,
      model: model,
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    });

    // Check if we have messages
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('❌ No messages found in request');
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OpenAI API key');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('📣 Creating chat completion with model:', model);

    // Format messages for OpenAI API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('📣 Formatted messages for OpenAI:', formattedMessages);

    // Create a streaming chat completion
    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
    });

    // Create a streaming response
    console.log('✅ Streaming response started');

    // Create a streaming response using the format expected by Vercel AI SDK
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // Format the chunk exactly as expected by Vercel AI SDK
                const payload = JSON.stringify({
                  choices: [{ delta: { content } }],
                });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              }
            }
            // End the stream with the [DONE] message
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            console.error('Error processing stream:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ Error in AI route:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      status: error.status,
      code: error.code,
    });

    // Return error as a regular JSON response
    return new Response(
      JSON.stringify({
        error: 'AI request failed',
        message: error.message || 'Unknown error',
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
  // try {
  //     // Process the request using the AI SDK
  //     console.log('🤖 Processing with AI SDK');
  //     return openai.run(req);
  // } catch (error: any) {
  //     console.error('❌ Error in AI route:', error);
  //     return NextResponse.json(
  //       { error: 'Failed to process request', details: error?.message || 'Unknown error' },
  //       { status: 500 }
  //     );
  // }
}
console.log('🔄 AI API Request received');

// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';

// // Proxy endpoint for the OpenAI Responses API
// export async function POST(req: NextRequest) {
//   const body = await req.json();

//   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//   if (body.text?.format?.type === 'json_schema') {
//     return await structuredResponse(openai, body);
//   } else {
//     return await textResponse(openai, body);
//   }
// }

// async function structuredResponse(openai: OpenAI, body: any) {
//   try {
//     const response = await openai.responses.parse({
//       ...(body as any),
//       stream: false,
//     });

//     return NextResponse.json(response);
//   } catch (err: any) {
//     console.error('responses proxy error', err);
//     return NextResponse.json({ error: 'failed' }, { status: 500 });
//   }
// }

// async function textResponse(openai: OpenAI, body: any) {
//   try {
//     const response = await openai.responses.create({
//       ...(body as any),
//       stream: false,
//     });
//     console.log('response', response);
//     return NextResponse.json(response);
//   } catch (err: any) {
//     console.error('responses proxy error', err);
//     return NextResponse.json({ error: 'failed' }, { status: 500 });
//   }
// }
