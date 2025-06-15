// Simple test script for routes.ts
const { AppRoutes } = require('./routes');

// Test data
const TEST_PROJECT_ID = 'proj_12345';
const TEST_CHAT_ID = 'chat_67890';

// Test basic routes
console.log('=== Testing routes.ts ===');
console.log('\n--- Testing basic routes ---');
console.log(`Home route: ${AppRoutes.home}`);
console.log(`Projects list: ${AppRoutes.projects.list}`);
console.log(`Project detail: ${AppRoutes.projects.detail(TEST_PROJECT_ID)}`);
console.log(`New project: ${AppRoutes.projects.new}`);

// Test chat routes
console.log('\n--- Testing chat routes ---');
console.log(`Chats list: ${AppRoutes.chats.list()}`);
console.log(`Chat detail: ${AppRoutes.chats.detail(TEST_CHAT_ID)}`);
console.log(`Project chat list: ${AppRoutes.chats.projectChat.list()}`);
console.log(
  `Project chat detail: ${AppRoutes.chats.projectChat.detail(TEST_CHAT_ID)}`,
);
console.log(`New project chat: ${AppRoutes.chats.projectChat.new()}`);

// Test API routes
console.log('\n--- Testing API routes ---');
console.log(`Chat API base: ${AppRoutes.api.chat.base}`);
console.log(`Chat API by ID: ${AppRoutes.api.chat.byId(TEST_CHAT_ID)}`);
console.log(`Chat API project: ${AppRoutes.api.chat.project}`);
console.log(`Chat API messages: ${AppRoutes.api.chat.messages(TEST_CHAT_ID)}`);
console.log(`Chat API history: ${AppRoutes.api.chat.history(TEST_CHAT_ID)}`);

// Test newly added API routes
console.log('\n--- Testing new API routes ---');
console.log(`Chat Project update: ${AppRoutes.api.chatProject.update}`);
console.log(`Chat Visibility update: ${AppRoutes.api.chatVisibility.update}`);
console.log(`Chat Model update: ${AppRoutes.api.chatModel.update}`);
console.log(`Chat History update: ${AppRoutes.api.chatHistory.update}`);
console.log(`Chat Message update: ${AppRoutes.api.chatMessage.update}`);
console.log(`Artifact update: ${AppRoutes.api.artifact.update}`);
console.log(`AI chat: ${AppRoutes.api.ai.chat}`);
