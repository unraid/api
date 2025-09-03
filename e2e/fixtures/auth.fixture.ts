import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../utils/pages/login.page.js';

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    const username = process.env.UNRAID_USERNAME || 'root';
    const password = process.env.UNRAID_PASSWORD || '';

    if (password) {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Check if we need to authenticate
      const needsAuth = await page.locator('input[name="username"], input[name="password"], input#user, input#pass').count() > 0;
      
      if (needsAuth) {
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
          await page.context().storageState({ path: 'auth.json' });
        }
      }
    }

    await use();
  },
});

export { expect };