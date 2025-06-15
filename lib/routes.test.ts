import {
  AppRoutes,
  navigateToProjectChat,
  getChatHistoryEndpoint,
  getChatMessagesEndpoint,
} from './routes';

// Test data
const TEST_PROJECT_ID = 'proj_12345';
const TEST_CHAT_ID = 'chat_67890';

// Test suite for routes
console.log('=== Testing routes.ts ===');

// Test basic routes
console.log('\n--- Testing basic routes ---');
console.log(`Home route: ${AppRoutes.home}`);
console.log(`Projects list: ${AppRoutes.projects.list}`);
console.log(`Project detail: ${AppRoutes.projects.detail(TEST_PROJECT_ID)}`);
console.log(`New project: ${AppRoutes.projects.new}`);

// Test chat routes
console.log('\n--- Testing chat routes ---');
console.log(`Chats list: ${AppRoutes.chats.list()}`);
console.log(`Chat detail: ${AppRoutes.chats.detail(TEST_CHAT_ID)}`);

// Test API routes
console.log('\n--- Testing API routes ---');
console.log(`Chat API base: ${AppRoutes.api.chats.base}`);
console.log(`Chat API by ID: ${AppRoutes.api.chats.byId(TEST_CHAT_ID)}`);
console.log(`Chat API messages: ${AppRoutes.api.chats.messages(TEST_CHAT_ID)}`);
console.log(`Chat API history: ${AppRoutes.api.chats.history(TEST_CHAT_ID)}`);
console.log(`Projects API base: ${AppRoutes.api.projects.base}`);
console.log(
  `Projects API by ID: ${AppRoutes.api.projects.byId(TEST_PROJECT_ID)}`,
);
console.log(
  `Projects API chats: ${AppRoutes.api.projects.chats(TEST_PROJECT_ID)}`,
);

// Test newly added API routes
console.log('\n--- Testing new API routes ---');

// Test helper functions
console.log('\n--- Testing helper functions ---');
console.log(`navigateToProjectChat: ${navigateToProjectChat(TEST_CHAT_ID)}`);
console.log(`getChatHistoryEndpoint: ${getChatHistoryEndpoint(TEST_CHAT_ID)}`);
console.log(
  `getChatMessagesEndpoint: ${getChatMessagesEndpoint(TEST_CHAT_ID)}`,
);

// Verify expected outputs
console.log('\n--- Verifying expected outputs ---');
const expectedProjectChatUrl = `/chats/${TEST_CHAT_ID}`;
const actualProjectChatUrl = navigateToProjectChat(TEST_CHAT_ID);
console.log(`Expected project chat URL: ${expectedProjectChatUrl}`);
console.log(`Actual project chat URL: ${actualProjectChatUrl}`);
console.log(`Match: ${expectedProjectChatUrl === actualProjectChatUrl}`);

const expectedHistoryEndpoint = `/api/chats/${TEST_CHAT_ID}/history`;
const actualHistoryEndpoint = getChatHistoryEndpoint(TEST_CHAT_ID);
console.log(`Expected history endpoint: ${expectedHistoryEndpoint}`);
console.log(`Actual history endpoint: ${actualHistoryEndpoint}`);
console.log(`Match: ${expectedHistoryEndpoint === actualHistoryEndpoint}`);

console.log('\n=== Routes testing complete ===');
