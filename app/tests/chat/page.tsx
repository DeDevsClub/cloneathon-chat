'use client';

import { useState, useEffect, useRef } from 'react';

// Generate a unique ID for messages
function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function TestChat() {
  const [messages, setMessages] = useState<
    Array<{ id: string; role: string; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/api/chats');
  const [chatId, setChatId] = useState(generateId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { id: generateId(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Format messages as expected by the API
      console.log('Sending messages:', newMessages);
      let aiEndpoint = endpoint;
      if (endpoint === '/api/chats') {
        aiEndpoint = '/api/chats';
      }
      // Send request to API
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: chatId, // Required chat ID
          messages: newMessages, // Send messages with IDs
          selectedChatModel: 'chat-model',
          selectedVisibilityType: 'private',
        }),
      });

      if (!response.ok) {
        console.error('HTTP error:', response.body);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process the stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log('Raw chunk:', chunk);

        // Process the chunk
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              console.log('Stream complete');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('Parsed chunk:', parsed);

              if (parsed.content !== undefined) {
                assistantMessage += parsed.content;
                // Update the messages with the current partial response
                setMessages([
                  ...newMessages,
                  {
                    id: generateId(),
                    role: 'assistant',
                    content: assistantMessage,
                  },
                ]);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          id: generateId(),
          role: 'system',
          content: `Error: ${(error as Error).message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat API Test</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="API Endpoint"
        />
        <button
          type="button"
          onClick={clearMessages}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>

      <div
        ref={messagesEndRef}
        className="border rounded p-4 h-96 overflow-y-auto mb-4"
      >
        {messages.length === 0 && (
          <div className="italic text-gray-500">
            Chat session started. Send a message to begin.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 p-3 rounded ${
              msg.role === 'user'
                ? 'bg-gray-100'
                : msg.role === 'assistant'
                  ? 'bg-blue-50'
                  : 'bg-yellow-50 italic'
            }`}
          >
            <strong>
              {msg.role === 'user'
                ? 'You'
                : msg.role === 'assistant'
                  ? 'Assistant'
                  : 'System'}
              :
            </strong>{' '}
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center text-gray-500">
            <div className="mr-2">Assistant is typing</div>
            <div className="animate-bounce">.</div>
            <div className="animate-bounce delay-100">.</div>
            <div className="animate-bounce delay-200">.</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message here..."
          disabled={isLoading}
          rows={3}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          Send
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Press Enter to send. Shift+Enter for new line.</p>
      </div>
    </div>
  );
}

export default TestChat;
