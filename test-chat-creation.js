// Simple test script to verify chat creation API
const testChatCreation = async () => {
  const testPayload = {
    messages: [{
      id: "test-msg-1",
      role: "user",
      content: "Hello, this is a test message"
    }]
  };

  try {
    console.log('Testing chat creation API...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('http://localhost:3000/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);

  } catch (error) {
    console.error('Test failed:', error);
  }
};

testChatCreation();
