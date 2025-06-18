#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugProjectChats() {
  console.log('🔍 Debugging Project Chats API...\n');

  try {
    // First, let's test the main projects endpoint
    console.log('1. Testing GET /api/projects (to get available projects)...');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      credentials: 'include', // This will include cookies
    });

    console.log(`Status: ${projectsResponse.status}`);

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.log(`❌ Projects fetch failed: ${errorText}`);
      console.log(
        '\n⚠️  Make sure you are logged in to the app in your browser first!',
      );
      return;
    }

    const projectsData = await projectsResponse.json();
    console.log(`✅ Found ${projectsData.projects?.length || 0} projects`);

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log('\n📝 No projects found. Please create a project first!');
      return;
    }

    const firstProject = projectsData.projects[0];
    console.log(
      `📁 Testing with project: "${firstProject.name}" (ID: ${firstProject.id})\n`,
    );

    // Test getting chats for this project
    console.log('2. Testing GET /api/projects/[projectId]/chats...');
    const chatsResponse = await fetch(
      `${BASE_URL}/api/projects/${firstProject.id}/chats`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    console.log(`Status: ${chatsResponse.status}`);

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text();
      console.log(`❌ Project chats fetch failed: ${errorText}`);

      // Check if it's an authentication issue
      if (chatsResponse.status === 401) {
        console.log('\n🔐 Authentication issue detected!');
        console.log('This usually means:');
        console.log('- You need to log in to the app in your browser first');
        console.log('- The NextAuth session cookies are not being sent');
        console.log('- The auth() function is not finding a valid session');
      }
      return;
    }

    const chatsData = await chatsResponse.json();
    console.log(
      `✅ Found ${chatsData.chats?.length || 0} chats for this project`,
    );

    if (chatsData.chats && chatsData.chats.length > 0) {
      console.log('📄 Project chats:');
      chatsData.chats.forEach((chat, index) => {
        console.log(`  ${index + 1}. "${chat.title}" (ID: ${chat.id})`);
      });
    } else {
      console.log('📝 No chats found for this project');
    }

    console.log(
      '\n3. Testing POST /api/projects/[projectId]/chats (create new chat)...',
    );

    const newChatData = {
      id: `test-chat-${Date.now()}`,
      title: `Test Chat ${new Date().toLocaleTimeString()}`,
      visibility: 'private',
    };

    const createResponse = await fetch(
      `${BASE_URL}/api/projects/${firstProject.id}/chats`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newChatData),
      },
    );

    console.log(`Status: ${createResponse.status}`);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ Chat creation failed: ${errorText}`);
    } else {
      const createdChat = await createResponse.json();
      console.log(`✅ Chat created successfully!`);
      console.log(
        `📄 New chat: "${createdChat.chat.title}" (ID: ${createdChat.chat.id})`,
      );
      console.log(`🔗 Project association: ${createdChat.chat.projectId}`);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the Next.js development server is running');
    console.log('2. Make sure you are logged in to the app in your browser');
    console.log('3. Check that the authentication routes are working');
  }
}

// Instructions for running
console.log('📋 To run this test:');
console.log('1. Make sure your Next.js app is running (npm run dev)');
console.log('2. Log in to your app in the browser first');
console.log("3. Create at least one project if you haven't already");
console.log('4. Run: node debug-project-chats.js\n');

debugProjectChats();
