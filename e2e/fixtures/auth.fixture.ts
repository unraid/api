import { test as loggerTest, expect, LoggerFixtures } from './logger.fixture';
import { LoginPage } from '../utils/pages/login.page.js';

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: void;
} & LoggerFixtures;

export const test = loggerTest.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page, logger }, use) => {
    const username = process.env.UNRAID_USERNAME || 'root';
    const password = process.env.UNRAID_PASSWORD || '';

    if (password) {
      logger.info('Attempting authentication');
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Check if we need to authenticate
      const needsAuth = await page.locator('input[name="username"], input[name="password"], input#user, input#pass').count() > 0;
      
      if (needsAuth) {
        logger.debug('Authentication required, filling credentials');
        // Try different selector combinations for username/password fields
        const usernameInput = page.locator('input[name="username"], input#user').first();
        const passwordInput = page.locator('input[name="password"], input#pass').first();
        const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login")').first();
        
        await usernameInput.fill(username);
        await passwordInput.fill(password);
        await submitButton.click();
        
        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');
        
        // Check if we successfully logged in
        const stillOnLogin = page.url().includes('login');
        if (!stillOnLogin) {
          logger.info('Authentication successful, saving storage state');
          await page.context().storageState({ path: 'auth.json' });
        } else {
          logger.warn('Authentication may have failed - still on login page');
        }
      } else {
        logger.debug('No authentication needed');
      }
    } else {
      logger.debug('No password configured, skipping authentication');
    }

    await use();
  },
});

export { expect };