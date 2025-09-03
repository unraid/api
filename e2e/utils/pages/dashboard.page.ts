import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly navigationMenu: Locator;
  readonly mainContent: Locator;
  readonly arrayStatus: Locator;
  readonly dockerContainers: Locator;
  readonly vmList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header, #header, .header');
    this.navigationMenu = page.locator('nav, #nav, .nav-menu');
    this.mainContent = page.locator('main, #content, .content');
    this.arrayStatus = page.locator('[data-test="array-status"], .array-status, #array-status');
    this.dockerContainers = page.locator('[data-test="docker-containers"], .docker-containers, #docker-containers');
    this.vmList = page.locator('[data-test="vm-list"], .vm-list, #vm-list');
  }

  async goto() {
    await this.page.goto('/Dashboard');
  }

  async isLoaded() {
    await this.mainContent.waitFor({ state: 'visible' });
  }

  async getArrayStatus() {
    return await this.arrayStatus.textContent();
  }

  async getDockerContainerCount() {
    const containers = await this.dockerContainers.locator('.container-item, tr').count();
    return containers;
  }

  async getVMCount() {
    const vms = await this.vmList.locator('.vm-item, tr').count();
    return vms;
  }

  async navigateTo(menuItem: string) {
    await this.navigationMenu.locator(`text="${menuItem}"`).click();
  }
}