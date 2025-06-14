import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, id } = await req.json();
  console.log({ messages, id });
  console.log('chat id', id); // can be used for persisting the chat

  // Call the language model
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
      console.log({ text, toolCalls, toolResults, usage, finishReason });
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
    },
  });
  console.log({ result });
  // Respond with the stream
  return result.toDataStreamResponse();
}
