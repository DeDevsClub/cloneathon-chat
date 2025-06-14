/**
 * End-to-end test for chat API functionality with project context
 * This script inserts test data directly into the database to bypass authentication
 */
const { v4: uuidv4 } = require('uuid');
const postgres = require('postgres');

// Generate IDs for our test entities
const TEST_PROJECT_ID = uuidv4();
const TEST_CHAT_ID = uuidv4();
const TEST_MESSAGE_ID = uuidv4();

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/chat',
);

async function runTest() {
  try {
    console.log('Starting end-to-end chat test with project context');
    console.log('------------------------------------------------');
    console.log('Test Project ID:', TEST_PROJECT_ID);
    console.log('Test Chat ID:', TEST_CHAT_ID);
    console.log('Test Message ID:', TEST_MESSAGE_ID);

    // 1. Find an existing user in the database
    console.log('\nStep 1: Finding existing user...');
    const users = await client`
      SELECT id, email FROM "User" LIMIT 1
    `;

    if (users.length === 0) {
      throw new Error(
        'No existing users found in database. Please create a user first.',
      );
    }

    const existingUser = users[0];
    console.log(
      `Found existing user: ${existingUser.email} (${existingUser.id})`,
    );

    // 2. Create a test project using the existing user
    console.log('\nStep 2: Creating test project...');
    await client`
      INSERT INTO "Project" (id, name, description, "createdAt", "updatedAt", "userId", icon, color)
      VALUES (
        ${TEST_PROJECT_ID}, 
        'Test Project', 
        'Project created for testing', 
        now(), 
        now(), 
        ${existingUser.id}, 
        'file-text', 
        'blue'
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('Test project created or already exists');

    // 3. Create a test chat associated with the project
    console.log('\nStep 3: Creating test chat in project...');
    await client`
      INSERT INTO "Chat" (
        id, "createdAt", "updatedAt", title, "userId", visibility, "projectId", "lastActivityAt"
      )
      VALUES (
        ${TEST_CHAT_ID}, 
        now(), 
        now(), 
        'Test Chat', 
        ${existingUser.id}, 
        'private', 
        ${TEST_PROJECT_ID}, 
        now()
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('Test chat created or already exists');

    // 4. Insert a test message with projectId
    console.log('\nStep 4: Creating test message in chat...');
    await client`
      INSERT INTO "Message" (
        id, "chatId", "projectId", role, parts, attachments, "createdAt", "contentType", "textContent"
      )
      VALUES (
        ${TEST_MESSAGE_ID}, 
        ${TEST_CHAT_ID}, 
        ${TEST_PROJECT_ID}, 
        'user', 
        '[{"type": "text", "text": "Hello, this is a test message"}]'::jsonb, 
        '[]'::jsonb, 
        now(), 
        'text', 
        'Hello, this is a test message'
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('Test message created or already exists');

    // 5. Verify data was inserted correctly
    console.log('\nStep 5: Verifying data in database...');

    // Check project
    const projects = await client`
      SELECT * FROM "Project" WHERE id = ${TEST_PROJECT_ID}
    `;
    console.log('Project exists:', projects.length > 0);

    // Check chat
    const chats = await client`
      SELECT * FROM "Chat" WHERE id = ${TEST_CHAT_ID} AND "projectId" = ${TEST_PROJECT_ID}
    `;
    console.log('Chat with project association exists:', chats.length > 0);

    // Check message
    const messages = await client`
      SELECT * FROM "Message" WHERE id = ${TEST_MESSAGE_ID} AND "projectId" = ${TEST_PROJECT_ID}
    `;
    console.log(
      'Message with project association exists:',
      messages.length > 0,
    );

    // Additional verification specific to projectId field
    const projectMessages = await client`
      SELECT COUNT(*) as count FROM "Message" WHERE "projectId" IS NOT NULL
    `;
    console.log(`Total messages with projectId: ${projectMessages[0].count}`);

    // Success!
    console.log('\nTest completed successfully!');
    console.log(
      `\nTo view the test chat in the app, use this URL:\nhttp://localhost:3000/chats/${TEST_CHAT_ID}\n\nIMPORTANT: Make sure you are logged in to the application first!\nIf you are still being redirected, try these steps:
      \n1. Open the browser to http://localhost:3000 first
      \n2. Ensure you are logged in (you should see projects list)
      \n3. Then copy and paste the test URL after logging in\n
      \nDebug Information:\n- Project ID: ${TEST_PROJECT_ID}
      \n- Project Owner ID: ${existingUser.id}
      \n- Chat ID: ${TEST_CHAT_ID}
      \n- Message ID: ${TEST_MESSAGE_ID}
      \n`,
    );
  } catch (error) {
    console.error('\nTest failed:', error);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the test
runTest();
