/**
 * Simple test for the chat API using fetch
 */
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

async function testChatApi() {
  // Generate test IDs
  const chatId = process.env.CHAT_ID || uuidv4();
  const projectId = process.env.PROJECT_ID || null;
  const messageId = uuidv4();

  console.log('Testing chat API with:');
  console.log(`Chat ID: ${chatId}`);
  console.log(`Project ID: ${projectId || null}`);

  // Create a payload that matches the expected schema
  const payload = {
    id: chatId,
    projectId: projectId || null,
    message: {
      id: messageId,
      role: 'user',
      parts: [
        {
          type: 'text',
          text: 'Hello, this is a test message to verify chat API functionality with project context',
        },
      ],
      experimental_attachments: [],
    },
    selectedChatModel: 'chat-model',
    selectedVisibilityType: 'private',
  };

  console.log('\nSending request to /api/chat...');
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    console.log(`Response status: ${status}`);

    // Handle response based on content type
    const contentType = response.headers.get('content-type');
    console.log(`Response content type: ${contentType}`);
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log(
        'Response text:',
        text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      );
    }

    // Print URL for manual testing in browser
    console.log('\nTest URL for browser:');
    console.log(`http://localhost:3000/chats/${chatId}`);

    return status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

testChatApi()
  .then((success) => {
    console.log(`\nTest ${success ? 'passed' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
