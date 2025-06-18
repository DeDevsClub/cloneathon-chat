const fetch = require('node-fetch');

async function testProjectCreation() {
  console.log('🧪 Testing Project Creation API...\n');
  
  try {
    // First, let's test the GET endpoint to see if it works
    console.log('1. Testing GET /api/projects...');
    const getResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`GET Status: ${getResponse.status}`);
    const getBody = await getResponse.text();
    console.log(`GET Response: ${getBody}\n`);
    
    // Now test the POST endpoint
    console.log('2. Testing POST /api/projects...');
    const postResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Debug Test Project',
        description: 'Testing project creation from script',
        icon: '🧪',
        color: '#ff6b6b'
      })
    });
    
    console.log(`POST Status: ${postResponse.status}`);
    const postBody = await postResponse.text();
    console.log(`POST Response: ${postBody}\n`);
    
    if (postResponse.status === 401) {
      console.log('❌ Authentication issue detected - this is likely the problem!');
      console.log('The API requires authentication but no session cookie was provided.');
    } else if (postResponse.status === 500) {
      console.log('❌ Server error detected - check server logs for details.');
    } else if (postResponse.status === 201) {
      console.log('✅ Project creation succeeded!');
    } else {
      console.log(`⚠️  Unexpected status code: ${postResponse.status}`);
    }
    
  } catch (error) {
    console.error('Error testing project creation:', error);
  }
}

// Run the test
testProjectCreation();
