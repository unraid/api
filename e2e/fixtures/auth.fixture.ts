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
      
      const needsAuth = await page.locator('input[name="username"], input[name="password"]').count() > 0;
      
      if (needsAuth) {
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"], input[type="submit"]');
        
        await expect(page).not.toHaveURL(/login/);
        
        await page.context().storageState({ path: 'auth.json' });
      }
    }

    await use();
  },
});

export { expect };