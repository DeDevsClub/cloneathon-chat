const puppeteer = require('puppeteer');

async function testWithAuthentication() {
  console.log('🧪 Testing Project Creation with Authentication...\n');

  let browser;
  try {
    // Launch browser to get proper cookies
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('1. Navigating to the app...');
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot to see current state
    await page.screenshot({ path: 'debug-home.png' });

    // Check if we need to login
    const isLoggedIn = (await page.$('text=Projects')) !== null;
    console.log(`Logged in status: ${isLoggedIn}`);

    if (!isLoggedIn) {
      console.log('2. Attempting to login...');

      // Try to navigate to login
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(1000);

      // Take screenshot of login page
      await page.screenshot({ path: 'debug-login.png' });

      // Look for guest login or other auth options
      const guestButton = await page.$('button:contains("Continue as Guest")');
      if (guestButton) {
        await guestButton.click();
        console.log('Clicked guest login');
      } else {
        console.log('No guest login found, trying other auth methods...');
        // You might need to implement specific login logic here
      }

      await page.waitForTimeout(2000);
    }

    // Navigate to projects page
    console.log('3. Navigating to projects page...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForTimeout(2000);

    // Get all cookies
    const cookies = await page.cookies();
    console.log(
      'Available cookies:',
      cookies.map((c) => ({
        name: c.name,
        value: `${c.value.substring(0, 20)}...`,
      })),
    );

    // Extract cookie header for API calls
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    console.log('Cookie header:', `${cookieHeader.substring(0, 100)}...`);

    // Now test the API with proper cookies
    console.log('\n4. Testing API with cookies...');

    const fetch = require('node-fetch');

    // Test GET endpoint
    console.log('Testing GET /api/projects with cookies...');
    const getResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    console.log(`GET Status: ${getResponse.status}`);
    const getBody = await getResponse.text();
    console.log(`GET Response: ${getBody}\n`);

    // Test POST endpoint
    console.log('Testing POST /api/projects with cookies...');
    const postResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: 'Auth Test Project',
        description: 'Testing project creation with authentication',
        icon: '🔐',
        color: '#4CAF50',
      }),
    });

    console.log(`POST Status: ${postResponse.status}`);
    const postBody = await postResponse.text();
    console.log(`POST Response: ${postBody}\n`);

    if (postResponse.status === 201) {
      console.log('✅ Project creation succeeded with authentication!');
    } else if (postResponse.status === 401) {
      console.log('❌ Still getting authentication error even with cookies');
      console.log(
        'This suggests the session cookie extraction logic may have issues',
      );
    } else {
      console.log(`⚠️  Unexpected status: ${postResponse.status}`);
    }
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testWithAuthentication();
} catch (e) {
  console.log(
    'Puppeteer not available. Please install it with: npm install puppeteer',
  );
  console.log(
    'For now, testing without authentication to confirm the issue...\n',
  );

  const fetch = require('node-fetch');

  // Test without cookies to confirm the auth issue
  fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Project' }),
  })
    .then((response) => response.text())
    .then((body) => {
      console.log('Response without cookies:', body);
      console.log('\n🔍 Issue confirmed: API requires authentication cookies');
      console.log('👉 Next steps: Check cookie extraction logic in the API');
    });
}
