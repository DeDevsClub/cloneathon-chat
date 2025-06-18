import { test, expect } from '@playwright/test';

test.describe('Project Creation Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}]`, msg.text());
      }
    });

    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/projects')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
        const headers = request.headers();
        console.log('[REQUEST HEADERS]', JSON.stringify(headers, null, 2));
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/projects')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
        try {
          const body = await response.text();
          console.log('[RESPONSE BODY]', body);
        } catch (e) {
          console.log('[RESPONSE] Could not read body');
        }
      }
    });
  });

  test('should successfully create a project after proper authentication', async ({
    page,
  }) => {
    // Step 1: Navigate to login page and authenticate
    console.log('🔐 Step 1: Authenticating user...');
    await page.goto('http://localhost:3000/login');

    // Wait for the login page to load
    await page.waitForSelector('button', { timeout: 10000 });

    // Look for guest login or other authentication methods
    const guestButton = page.locator(
      'button:has-text("Continue as Guest"), button:has-text("Guest")',
    );
    if (await guestButton.isVisible()) {
      console.log('Found guest login button, clicking...');
      await guestButton.click();
      await page.waitForURL(/\/(dashboard|projects|chats|$)/, {
        timeout: 10_000,
      });
    } else {
      // Try to find regular login form
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]',
      );
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]',
      );

      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await page.click('button[type="submit"], button:has-text("Sign In")');
        await page.waitForURL(/\/(dashboard|projects|chats)/, {
          timeout: 10000,
        });
      } else {
        console.log('No authentication method found, continuing...');
      }
    }

    // Step 2: Check cookies after authentication
    console.log('🍪 Step 2: Checking cookies after authentication...');
    const cookies = await page.context().cookies();
    console.log(
      'Available cookies after auth:',
      cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        value: `${c.value.substring(0, 20)}...`,
      })),
    );

    // Step 3: Navigate to projects page
    console.log('📁 Step 3: Navigating to projects page...');
    await page.goto('http://localhost:3000/projects');

    // Wait for projects page to load
    await page.waitForSelector('h1:has-text("Projects")', { timeout: 10000 });

    // Step 4: Open create project dialog
    console.log('➕ Step 4: Opening create project dialog...');
    const newProjectButton = page.locator('button:has-text("New Project")');
    await expect(newProjectButton).toBeVisible();
    await newProjectButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('text=Create new project', { timeout: 5000 });

    // Step 5: Fill out the project form
    console.log('📝 Step 5: Filling out project form...');
    const nameInput = page.locator(
      'input[name="name"], label:has-text("Name") + input',
    );
    await nameInput.fill('E2E Test Project');

    const descriptionInput = page.locator(
      'textarea[name="description"], label:has-text("Description") + textarea',
    );
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('Created by automated test');
    }

    // Step 6: Submit the form and monitor the API call
    console.log('🚀 Step 6: Submitting project creation form...');
    const createButton = page.locator('button:has-text("Create")');
    await createButton.click();

    // Step 7: Wait for response and validate
    console.log('⏳ Step 7: Waiting for project creation response...');

    // Check for success toast
    const successToast = page.locator('text=Project created successfully');
    const errorToast = page.locator(
      'text=Project Creation Failed, text=Authentication Required, text=Failed to create project',
    );

    try {
      // Wait for either success or error
      await Promise.race([
        successToast.waitFor({ timeout: 10000 }),
        errorToast.waitFor({ timeout: 10000 }),
      ]);

      if (await successToast.isVisible()) {
        console.log('✅ SUCCESS: Project created successfully!');

        // Verify we're redirected or dialog closed
        const dialogStillOpen = await page
          .locator('text=Create new project')
          .isVisible();
        if (!dialogStillOpen) {
          console.log('✅ Dialog closed successfully');
        }

        // Check if project appears in the list
        await page.waitForTimeout(2000); // Give time for list refresh
        const projectItems = await page
          .locator(
            '[data-testid*="project"], .project-item, text="E2E Test Project"',
          )
          .count();
        console.log(`📊 Projects visible: ${projectItems}`);
      } else if (await errorToast.isVisible()) {
        const errorText = await errorToast.textContent();
        console.log(
          '❌ FAILED: Project creation failed with error:',
          errorText,
        );

        // This indicates our fix didn't work
        throw new Error(`Project creation failed: ${errorText}`);
      }
    } catch (timeoutError) {
      console.log('⚠️  TIMEOUT: No toast message appeared');

      // Check current page state
      const dialogOpen = await page
        .locator('text=Create new project')
        .isVisible();
      console.log('Dialog still open:', dialogOpen);

      const buttonState = await createButton.textContent();
      console.log('Create button text:', buttonState);

      throw new Error('Project creation timed out - no response received');
    }
  });

  test('should validate authentication issues are resolved', async ({
    page,
  }) => {
    // This test focuses specifically on the authentication aspect
    console.log('🔍 Testing authentication resolution...');

    // Navigate and authenticate
    await page.goto('http://localhost:3000/login');
    const guestButton = page.locator(
      'button:has-text("Continue as Guest"), button:has-text("Guest")',
    );
    if (await guestButton.isVisible()) {
      await guestButton.click();
      await page.waitForURL(/\/(dashboard|projects|chats|$)/, {
        timeout: 10000,
      });
    }

    // Navigate to projects
    await page.goto('http://localhost:3000/projects');
    await page.waitForSelector('h1:has-text("Projects")', { timeout: 10000 });

    // Get cookies for API call
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Make direct API call using Playwright's request context
    const response = await page.request.post(
      'http://localhost:3000/api/projects',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Direct API Test Project',
          description: 'Testing direct API authentication',
          icon: '🔧',
          color: '#2196F3',
        },
      },
    );

    const responseBody = await response.text();
    console.log(`Direct API Response: ${response.status()}`);
    console.log(`Response body: ${responseBody}`);

    if (response.status() === 201) {
      console.log('✅ Direct API call succeeded - authentication is working!');
    } else if (response.status() === 401) {
      console.log(
        '❌ Direct API call failed - authentication issue still exists',
      );
      throw new Error('Authentication is still failing for direct API calls');
    } else {
      console.log(`⚠️  Unexpected API response: ${response.status()}`);
      throw new Error(
        `Unexpected API response: ${response.status()} - ${responseBody}`,
      );
    }
  });
});
