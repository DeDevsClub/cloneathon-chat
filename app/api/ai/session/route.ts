import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      // 'https://api.openai.com/v1/realtime/sessions',
      'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer xai-dLp18ZqpQDHs683I6VKM7nqNbUfLQWWPtYZjT7tv7Kj34KDWb6PjrddCSCe4e4ZFd1LwPfwSzHZKOWdb`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'user',
              content: 'as',
            },
          ],
          stream: false,
          temperature: 0.7,
        }),
      },
    );
    const data = await response.json();
    console.log({ data });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
// curl https://api.x.ai/v1/chat/completions \
// -H "Content-Type: application/json" \
// -H "Authorization: Bearer xai-dLp18ZqpQDHs683I6VKM7nqNbUfLQWWPtYZjT7tv7Kj34KDWb6PjrddCSCe4e4ZFd1LwPfwSzHZKOWdb" \
// -d '{
//   "messages": [
//     {
//       "role": "user",
//       "content": "as"
//     }
//   ],
//   "model": "grok-3-latest",
//   "stream": false,
//   "temperature": 0.7
// }'
