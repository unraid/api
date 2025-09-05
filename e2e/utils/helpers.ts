import { Page } from '@playwright/test';

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

export async function clearCookies(page: Page) {
  await page.context().clearCookies();
}

export async function setLocalStorage(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => {
    localStorage.setItem(k, v);
  }, [key, value]);
}

export async function getLocalStorage(page: Page, key: string) {
  return await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);
}

export async function waitForElement(page: Page, selector: string, timeout = 30000) {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

export async function isElementVisible(page: Page, selector: string) {
  return await page.locator(selector).isVisible();
}

export async function clickAndWaitForNavigation(page: Page, selector: string) {
  await Promise.all([
    page.waitForNavigation(),
    page.click(selector)
  ]);
}

export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, value);
  }
}

export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}