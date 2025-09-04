import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { 
      outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR || 'playwright-report',
      open: process.env.PLAYWRIGHT_HTML_OPEN as 'always' | 'never' | 'on-failure' || 'on-failure'
    }],
    ['line'],
    process.env.CI ? ['github'] : null,
  ].filter(Boolean) as any,
  outputDir: process.env.TEST_RESULTS_DIR || 'test-results',
  use: {
    baseURL: process.env.UNRAID_URL || 'http://tower.local',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    
    ignoreHTTPSErrors: true,
    
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  timeout: 60000,
  
  expect: {
    timeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: process.env.NO_WEB_SERVER ? undefined : {
    command: 'echo "Using external Unraid server"',
    url: process.env.UNRAID_URL || 'http://tower.local',
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
  },
});
