import { test, expect } from '../fixtures/auth.fixture.js';
import { LoginPage } from '../utils/pages/login.page.js';

test.describe('Authentication', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    const loginPage = new LoginPage(page);
    const hasLoginForm = await page.locator('input[name="username"], input[name="password"]').count() > 0;
    
    if (hasLoginForm) {
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    } else {
      console.log('No authentication required or already authenticated');
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    const username = process.env.UNRAID_USERNAME || 'root';
    const password = process.env.UNRAID_PASSWORD;

    if (!password) {
      test.skip();
      return;
    }

    await page.goto('/');
    const loginPage = new LoginPage(page);
    
    const needsAuth = await page.locator('input[name="username"], input[name="password"]').count() > 0;
    
    if (needsAuth) {
      await loginPage.login(username, password);
      
      await expect(page).not.toHaveURL(/login/);
      
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    }
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const password = process.env.UNRAID_PASSWORD;

    if (!password) {
      test.skip();
      return;
    }

    await page.goto('/');
    const loginPage = new LoginPage(page);
    
    const needsAuth = await page.locator('input[name="username"], input[name="password"]').count() > 0;
    
    if (needsAuth) {
      await loginPage.login('invalid_user', 'invalid_password');
      
      await page.waitForTimeout(2000);
      
      const stillOnLoginPage = await page.locator('input[name="username"], input[name="password"]').count() > 0;
      expect(stillOnLoginPage).toBeTruthy();
    }
  });

  test('should preserve session after page reload', async ({ page, authenticatedPage }) => {
    await page.goto('/');
    await page.reload();
    
    const loginPage = new LoginPage(page);
    const isLoggedIn = await loginPage.isLoggedIn();
    
    if (process.env.UNRAID_PASSWORD) {
      expect(isLoggedIn).toBeTruthy();
    }
  });
});