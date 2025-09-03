import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"]');
    this.errorMessage = page.locator('.error, .alert-error, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async isLoggedIn() {
    const loginElements = await this.page.locator('input[name="username"], input[name="password"]').count();
    return loginElements === 0;
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}