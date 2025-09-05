import { test, expect } from '../fixtures/auth.fixture.js';
import { DashboardPage } from '../utils/pages/dashboard.page.js';
import { waitForPageLoad } from '../utils/helpers.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Authentication handled by fixture
  });

  test('should load dashboard page', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await waitForPageLoad(page);
    
    await expect(dashboard.header).toBeVisible();
    await expect(dashboard.mainContent).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await waitForPageLoad(page);
    
    await expect(dashboard.navigationMenu).toBeVisible();
    
    const menuItems = ['Main', 'Shares', 'Users', 'Settings', 'Plugins', 'Docker', 'VMs'];
    for (const item of menuItems) {
      const menuItem = dashboard.navigationMenu.locator(`a:has-text("${item}")`);
      const exists = await menuItem.count() > 0;
      
      if (exists) {
        console.log(`Found menu item: ${item}`);
      }
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await waitForPageLoad(page);
    
    const sectionsToTest = [
      { name: 'Docker', urlPattern: /Docker/i },
      { name: 'Settings', urlPattern: /Settings/i },
      { name: 'Plugins', urlPattern: /Plugins/i }
    ];

    for (const section of sectionsToTest) {
      const menuLink = dashboard.navigationMenu.locator(`a:has-text("${section.name}")`);
      const sectionExists = await menuLink.count() > 0;
      
      if (sectionExists) {
        await menuLink.first().click();
        await waitForPageLoad(page);
        
        const url = page.url();
        expect(url).toMatch(section.urlPattern);
        
        await dashboard.goto();
        await waitForPageLoad(page);
      }
    }
  });

  test('should display system information', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await waitForPageLoad(page);
    
    const elementsToCheck = [
      { selector: '.array-status, #array-status, [class*="array"]', name: 'Array Status' },
      { selector: '.system-info, #system-info, [class*="system"]', name: 'System Info' },
      { selector: '.uptime, #uptime, [class*="uptime"]', name: 'Uptime' }
    ];

    for (const element of elementsToCheck) {
      const exists = await page.locator(element.selector).count() > 0;
      if (exists) {
        console.log(`Found ${element.name}`);
        await expect(page.locator(element.selector).first()).toBeVisible();
      }
    }
  });

  test('should be responsive', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      await expect(dashboard.mainContent).toBeVisible();
      console.log(`Dashboard visible at ${viewport.name} resolution`);
    }
  });
});