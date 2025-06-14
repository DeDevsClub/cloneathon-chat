/**
 * Simple test script for chat API functionality
 * Usage: node test-chat-api.js
 */
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authCookie = '';

// Helper to generate a unique UUID
const generateUUID = () => uuidv4();

// Helper function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (authCookie) {
    headers.Cookie = authCookie;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Capture cookies if they exist
  if (response.headers.get('set-cookie')) {
    authCookie = response.headers.get('set-cookie');
  }

  return response;
}

// Step 1: Create a guest user session
async function createGuestSession() {
  console.log('Creating guest session...');
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/guest`, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to create guest session: ${response.status}`);
  }

  console.log('Guest session created successfully');
  return response;
}

// Step 2: Get projects
async function getProjects() {
  console.log('Fetching projects...');
  const response = await fetchWithAuth(`${BASE_URL}/api/projects`);

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  const projects = await response.json();
  console.log(`Found ${projects.length} projects`);
  return projects[0]; // Return the first project
}

// Step 3: Create a new chat in a project
async function createProjectChat(projectId) {
  const chatId = generateUUID();
  console.log(`Creating chat ${chatId} in project ${projectId}...`);

  const payload = {
    id: chatId,
    title: `Test Chat ${new Date().toISOString()}`,
    visibility: 'private',
    projectId,
  };

  const response = await fetchWithAuth(
    `${BASE_URL}/api/projects/${projectId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create chat: ${response.status}`);
  }

  console.log('Chat created successfully');
  return chatId;
}

// Step 4: Send a message to chat
async function sendMessage(chatId, projectId) {
  const messageId = generateUUID();
  console.log(`Sending message to chat ${chatId} in project ${projectId}...`);

  const payload = {
    id: chatId,
    projectId: projectId,
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

  const response = await fetchWithAuth(`${BASE_URL}/api/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }

  console.log('Message sent successfully');
  console.log('Response status:', response.status);

  // The response is a stream, so we'll just check that it started successfully
  return response.status === 200;
}

// Run the test
async function runTest() {
  try {
    await createGuestSession();
    const project = await getProjects();
    const chatId = await createProjectChat(project.id);
    const messageSuccess = await sendMessage(chatId, project.id);

    console.log('\nTest result:');
    console.log('------------');
    console.log(`Project ID: ${project.id}`);
    console.log(`Chat ID: ${chatId}`);
    console.log(`Message sent successfully: ${messageSuccess}`);
    console.log('\nChat URL (copy and paste into browser):');
    console.log(`${BASE_URL}/projects/${project.id}/chats/${chatId}`);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();
