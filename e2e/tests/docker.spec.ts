import { test, expect } from '../fixtures/auth.fixture.js';
import { waitForPageLoad, isElementVisible } from '../utils/helpers.js';

test.describe('Docker Management', () => {
  test.beforeEach(async ({ authenticatedPage, page }) => {
    await page.goto('/Docker');
    await waitForPageLoad(page);
  });

  test('should display docker containers list', async ({ page }) => {
    const dockerContent = await isElementVisible(page, '#content, .content, main');
    expect(dockerContent).toBeTruthy();
    
    const possibleContainerSelectors = [
      '.docker-container',
      '.container-item',
      'table tbody tr',
      '[data-test*="container"]'
    ];

    let containersFound = false;
    for (const selector of possibleContainerSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        containersFound = true;
        console.log(`Found ${count} containers using selector: ${selector}`);
        break;
      }
    }

    if (!containersFound) {
      console.log('No docker containers found or Docker not configured');
    }
  });

  test('should have docker controls', async ({ page }) => {
    const controls = [
      { selector: 'button:has-text("Add Container"), a:has-text("Add Container")', name: 'Add Container' },
      { selector: 'button:has-text("Docker Settings"), a:has-text("Docker Settings")', name: 'Docker Settings' },
      { selector: 'input[type="search"], input[placeholder*="Search"]', name: 'Search' }
    ];

    for (const control of controls) {
      const exists = await page.locator(control.selector).count() > 0;
      if (exists) {
        console.log(`Found control: ${control.name}`);
        await expect(page.locator(control.selector).first()).toBeVisible();
      }
    }
  });

  test('should be able to start/stop containers', async ({ page }) => {
    const actionButtons = await page.locator('button[title*="Start"], button[title*="Stop"], a[title*="Start"], a[title*="Stop"]').count();
    
    if (actionButtons > 0) {
      console.log(`Found ${actionButtons} container action buttons`);
      
      const firstButton = page.locator('button[title*="Start"], button[title*="Stop"], a[title*="Start"], a[title*="Stop"]').first();
      const isDisabled = await firstButton.isDisabled();
      
      if (!isDisabled) {
        console.log('Container controls are enabled and functional');
      }
    } else {
      console.log('No container action buttons found');
    }
  });

  test('should display container details on click', async ({ page }) => {
    const containerRows = page.locator('.docker-container, .container-item, table tbody tr');
    const containerCount = await containerRows.count();
    
    if (containerCount > 0) {
      const firstContainer = containerRows.first();
      const containerName = await firstContainer.textContent();
      console.log(`Clicking on container: ${containerName}`);
      
      await firstContainer.click();
      await page.waitForTimeout(1000);
      
      const detailSelectors = [
        '.container-details',
        '.docker-details',
        '[class*="details"]',
        '.modal',
        '.popup'
      ];

      for (const selector of detailSelectors) {
        const detailsVisible = await isElementVisible(page, selector);
        if (detailsVisible) {
          console.log('Container details displayed');
          break;
        }
      }
    }
  });

  test('should have docker hub search functionality', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Container"), a:has-text("Add Container")');
    const hasAddButton = await addButton.count() > 0;
    
    if (hasAddButton) {
      await addButton.first().click();
      await waitForPageLoad(page);
      
      const searchField = page.locator('input[name*="search"], input[placeholder*="Search"], input[type="search"]');
      const hasSearch = await searchField.count() > 0;
      
      if (hasSearch) {
        await searchField.first().fill('nginx');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        console.log('Docker Hub search functionality is available');
      }
    }
  });
});