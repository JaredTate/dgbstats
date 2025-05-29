import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3005',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Timeout for each test */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific settings for better compatibility
        hasTouch: true,
        actionTimeout: 15000,
        navigationTimeout: 45000,
      },
    },

    /* Test against mobile viewports with enhanced WebKit support. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Enhanced mobile Chrome settings
        hasTouch: true,
        isMobile: true,
        // Mobile-specific timeouts
        actionTimeout: 12000,
        navigationTimeout: 30000,
        // Viewport override for consistency
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Enhanced WebKit/Safari settings for better compatibility
        hasTouch: true,
        isMobile: true,
        // Longer timeouts for WebKit rendering
        actionTimeout: 20000,
        navigationTimeout: 60000,
        // Specific viewport for testing
        viewport: { width: 375, height: 812 },
        // WebKit-specific user agent
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'Mobile Safari Legacy',
      use: { 
        ...devices['iPhone 8'],
        // Test older iOS WebKit versions
        hasTouch: true,
        isMobile: true,
        actionTimeout: 18000,
        navigationTimeout: 45000,
        viewport: { width: 375, height: 667 },
      },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        // Edge-specific settings
        actionTimeout: 12000,
      },
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        // Chrome-specific settings
        actionTimeout: 10000,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Global timeout - extended for mobile testing */
  timeout: 90000,

  /* Global test timeout - extended for mobile compatibility */
  expect: {
    timeout: 15000,
  },
});