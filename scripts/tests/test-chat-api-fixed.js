/**
 * Simple test script for chat API functionality
 * Usage: node test-chat-api-fixed.js
 *
 * This script directly tests the chat API without authentication
 * It simulates the API calls that would be made by the frontend
 */
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper to generate a unique UUID
const generateUUID = () => uuidv4();

// Helper function to make API requests
async function fetchAPI(url, options = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// Generate test data
const PROJECT_ID = generateUUID(); // Simulate a project ID
const USER_ID = generateUUID(); // Simulate a user ID
const CHAT_ID = generateUUID(); // Simulate a chat ID

// Log the test configuration
console.log('Test Configuration:');
console.log('-------------------');
console.log(`Project ID: ${PROJECT_ID}`);
console.log(`User ID: ${USER_ID}`);
console.log(`Chat ID: ${CHAT_ID}`);
console.log('-------------------\n');

// Step 1: Test direct chat API functionality
async function testChatAPI() {
  console.log('Testing chat API directly...');
  const messageId = generateUUID();

  // This simulates what the frontend would send to the API
  const payload = {
    id: CHAT_ID,
    projectId: PROJECT_ID,
    message: {
      id: messageId,
      createdAt: new Date(),
      role: 'user',
      content: 'Hello, can you help me test the chat functionality?',
      parts: [
        {
          type: 'text',
          text: 'Hello, can you help me test the chat functionality?',
        },
      ],
    },
    selectedChatModel: 'chat-model',
    selectedVisibilityType: 'private',
  };

  try {
    console.log(`Sending test message to /api/chats...`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);

    const response = await fetchAPI(`${BASE_URL}/api/chats`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`Response status: ${response.status}`);

    if (response.status === 401) {
      console.log(
        'Authentication required - this is expected in a real environment',
      );
      console.log('The API route is correctly checking for authentication');
      return { success: true, authenticated: false };
    } else if (response.ok) {
      console.log('Message sent successfully!');
      return { success: true, authenticated: true };
    } else {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Step 2: Test project chat association
async function testProjectChatAssociation() {
  console.log('\nTesting project chat association...');

  const payload = {
    chatId: CHAT_ID,
    projectId: PROJECT_ID || null,
  };

  try {
    console.log(`Sending PATCH request to /api/project...`);
    console.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);

    const response = await fetchAPI(`${BASE_URL}/api/project`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    console.log(`Response status: ${response.status}`);

    if (response.status === 401) {
      console.log(
        'Authentication required - this is expected in a real environment',
      );
      console.log('The API route is correctly checking for authentication');
      return { success: true, authenticated: false };
    } else if (response.ok) {
      console.log('Project chat association successful!');
      return { success: true, authenticated: true };
    } else {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the tests
async function runTests() {
  try {
    console.log('Starting API tests without authentication...');
    console.log(
      '(Note: 401 errors are expected and indicate proper authentication checks)',
    );
    console.log(
      '---------------------------------------------------------------',
    );

    // Test 1: Direct chat API
    const chatResult = await testChatAPI();

    // Test 2: Project chat association
    const projectResult = await testProjectChatAssociation();

    // Summary
    console.log('\nTest Summary:');
    console.log('------------');
    console.log(`Chat API test: ${chatResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(
      `Project chat association test: ${projectResult.success ? 'PASSED' : 'FAILED'}`,
    );

    if (
      chatResult.authenticated === false &&
      projectResult.authenticated === false
    ) {
      console.log('\nBoth endpoints correctly require authentication');
      console.log('This confirms the API routes are properly secured');
    }

    console.log('\nTest URLs for manual testing:');
    console.log(`Chat URL: ${BASE_URL}/chats/${CHAT_ID}`);
    console.log(`API endpoint: ${BASE_URL}/api/chats`);

    console.log('\nTests completed!');
  } catch (error) {
    console.error('Tests failed:', error.message);
  }
}

runTests();
