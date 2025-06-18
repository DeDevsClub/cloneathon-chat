import { test, expect } from '@playwright/test';

test.describe('Project Creation Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logs to see errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // Navigate to the homepage
    await page.goto('http://localhost:3000');
  });

  test('should debug project creation flow', async ({ page }) => {
    // Check if we're already logged in by looking for projects page elements
    const isLoggedIn = await page
      .locator('text=Projects')
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      // If not logged in, navigate to login page and authenticate
      await page.goto('http://localhost:3000/login');

      // Wait for login form to be visible
      await page.waitForSelector('button:has-text("Sign In")', {
        timeout: 10000,
      });

      // Try guest login if available
      const guestButton = page.locator('button:has-text("Continue as Guest")');
      if (await guestButton.isVisible()) {
        await guestButton.click();
      } else {
        // Try to find and use email/password login
        const emailInput = page.locator(
          'input[type="email"], input[name="email"]',
        );
        const passwordInput = page.locator(
          'input[type="password"], input[name="password"]',
        );
        const signInButton = page.locator('button:has-text("Sign In")');

        if (await emailInput.isVisible()) {
          await emailInput.fill('test@example.com');
          await passwordInput.fill('password123');
          await signInButton.click();
        }
      }

      // Wait for redirect after login
      await page.waitForURL(/\/(dashboard|projects|chats)/, { timeout: 10000 });
    }

    // Navigate to projects page
    await page.goto('http://localhost:3000/projects');

    // Wait for projects page to load
    await page.waitForSelector('h1:has-text("Projects")', { timeout: 10000 });

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-01-projects-page.png' });

    // Find and click the "New Project" button
    const newProjectButton = page.locator('button:has-text("New Project")');
    await expect(newProjectButton).toBeVisible();
    await newProjectButton.click();

    // Wait for the dialog to open
    await page.waitForSelector('text=Create new project', { timeout: 5000 });

    // Take screenshot of the dialog
    await page.screenshot({ path: 'debug-02-create-dialog.png' });

    // Fill out the form
    const nameInput = page.locator(
      'input[name="name"], label:has-text("Name") + input',
    );
    await nameInput.fill('Test Project Debug');

    const descriptionInput = page.locator(
      'textarea[name="description"], label:has-text("Description") + textarea',
    );
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This is a test project for debugging');
    }

    // Take screenshot of filled form
    await page.screenshot({ path: 'debug-03-filled-form.png' });

    // Listen for network requests to the API
    const apiRequests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/projects')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
        });
      }
    });

    // Listen for network responses from the API
    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/projects')) {
        try {
          const responseBody = await response.text();
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: responseBody,
          });
        } catch (e) {
          console.log('Error reading response body:', e);
        }
      }
    });

    // Submit the form
    const createButton = page.locator('button:has-text("Create")');
    await createButton.click();

    // Wait a moment for the request to complete
    await page.waitForTimeout(3000);

    // Log the API requests and responses for debugging
    console.log('API Requests:', JSON.stringify(apiRequests, null, 2));
    console.log('API Responses:', JSON.stringify(apiResponses, null, 2));

    // Take screenshot after submission
    await page.screenshot({ path: 'debug-04-after-submit.png' });

    // Check for success indicators
    const successToast = page.locator('text=Project created successfully');
    const errorToast = page.locator(
      'text=Project Creation Failed, text=Authentication Required, text=Failed to create project',
    );

    // Wait for either success or error
    try {
      await Promise.race([
        successToast.waitFor({ timeout: 5000 }),
        errorToast.waitFor({ timeout: 5000 }),
      ]);

      if (await successToast.isVisible()) {
        console.log('✅ Project creation succeeded');
        await page.screenshot({ path: 'debug-05-success.png' });
      } else if (await errorToast.isVisible()) {
        console.log('❌ Project creation failed');
        await page.screenshot({ path: 'debug-05-error.png' });

        // Log the error message
        const errorMessage = await errorToast.textContent();
        console.log('Error message:', errorMessage);
      }
    } catch (e) {
      console.log('No toast message appeared - checking current state');
      await page.screenshot({ path: 'debug-05-no-toast.png' });
    }

    // Check if we're still on the dialog or if it closed
    const dialogStillOpen = await page
      .locator('text=Create new project')
      .isVisible();
    console.log('Dialog still open:', dialogStillOpen);

    // Check if we have any projects listed now
    const projectItems = await page
      .locator('[data-testid="project-item"], .project-item')
      .count();
    console.log('Number of projects visible:', projectItems);

    // Final screenshot
    await page.screenshot({ path: 'debug-06-final-state.png' });
  });

  test('should test API endpoint directly', async ({ page, request }) => {
    // Navigate to ensure we have a session
    await page.goto('http://localhost:3000/projects');
    await page.waitForSelector('h1:has-text("Projects")', { timeout: 10000 });

    // Get cookies from the browser context
    const cookies = await page.context().cookies();
    console.log(
      'Available cookies:',
      cookies.map((c) => ({
        name: c.name,
        value: `${c.value.substring(0, 10)}...`,
      })),
    );

    // Prepare headers for API request
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Make direct API call to create project
    try {
      const response = await request.post(
        'http://localhost:3000/api/projects',
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          data: {
            name: 'Direct API Test Project',
            description: 'Testing direct API call',
            icon: '🧪',
            color: '#ff6b6b',
          },
        },
      );

      const responseBody = await response.text();
      console.log('Direct API Response Status:', response.status());
      console.log('Direct API Response Body:', responseBody);

      if (response.ok()) {
        console.log('✅ Direct API call succeeded');
      } else {
        console.log('❌ Direct API call failed');
      }
    } catch (error) {
      console.log('Error making direct API call:', error);
    }
  });
});
