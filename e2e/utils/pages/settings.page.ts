import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly themeSelector: Locator;
  readonly applyButton: Locator;
  readonly displaySettingsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.themeSelector = page.locator('select[name="theme"]');
    this.applyButton = page.locator('input[type="submit"][value="Apply"], button:has-text("Apply")');
    this.displaySettingsLink = page.locator('a:has-text("Display Settings")');
  }

  async goto() {
    await this.page.goto('/Settings');
  }

  async goToDisplaySettings() {
    await this.page.goto('/Settings/DisplaySettings');
    // Fallback: click on Display Settings if direct URL doesn't work
    const currentUrl = this.page.url();
    if (!currentUrl.includes('DisplaySettings')) {
      await this.goto();
      await this.displaySettingsLink.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async setTheme(theme: 'white' | 'black') {
    await this.goToDisplaySettings();
    await this.themeSelector.selectOption(theme);
    await this.applyButton.click();
    await this.page.waitForLoadState('networkidle');
    // Wait a bit for theme to apply
    await this.page.waitForTimeout(1_000);
  }

  async getCurrentTheme(): Promise<string> {
    await this.goToDisplaySettings();
    return await this.themeSelector.inputValue();
  }
}