import { Page } from '@playwright/test';

export async function triggerToast(page: Page, type: 'success' | 'info' | 'warning' | 'error' | 'default' = 'default', message?: string) {
  const toastMessage = message || `Test ${type} notification`;
  
  // Execute JavaScript to trigger a toast using the Unraid toast system
  await page.evaluate(([msg, toastType]) => {
    if ((window as any).toast) {
      if (toastType === 'default') {
        // Simple toast call
        (window as any).toast(msg, { duration: 5000 });
      } else {
        // Typed toast call (success, info, warning, error)
        (window as any).toast[toastType](msg, { duration: 5000 });
      }
    } else {
      console.error('Toast function not available');
    }
  }, [toastMessage, type]);
  
  // Give the toast a moment to appear
  await page.waitForTimeout(500);
}

export async function waitForToast(page: Page) {
  // Look for toast elements in the Unraid toaster structure
  const toastLocator = page.locator('ol.toaster li').first();
  
  // Wait for the toast to be visible
  await toastLocator.waitFor({ state: 'visible', timeout: 5000 });
  
  return toastLocator;
}

export async function getToastStyles(page: Page) {
  const toast = await waitForToast(page);
  
  // Get computed styles of the toast
  const styles = await toast.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      // Convert rgb to a more readable format
      backgroundRgb: computed.backgroundColor.match(/\d+/g)?.map(Number) || [],
      textRgb: computed.color.match(/\d+/g)?.map(Number) || []
    };
  });

  return styles;
}

export function isLightBackground(rgb: number[]): boolean {
  if (rgb.length < 3) return true;
  // Calculate luminance
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.5;
}

export function isDarkBackground(rgb: number[]): boolean {
  return !isLightBackground(rgb);
}

export function getContrastRatio(bgRgb: number[], textRgb: number[]): number {
  if (bgRgb.length < 3 || textRgb.length < 3) return 21; // Max contrast
  
  // Calculate relative luminance
  const getLuminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const bgLuminance = getLuminance(bgRgb);
  const textLuminance = getLuminance(textRgb);
  
  // Calculate contrast ratio
  const lighter = Math.max(bgLuminance, textLuminance);
  const darker = Math.min(bgLuminance, textLuminance);
  const contrast = (lighter + 0.05) / (darker + 0.05);
  
  return contrast;
}

export function hasGoodContrast(bgRgb: number[], textRgb: number[]): boolean {
  // WCAG AA requires at least 4.5:1 for normal text
  return getContrastRatio(bgRgb, textRgb) >= 4.5;
}

export function getLuminance(rgb: number[]): number {
  if (rgb.length < 3) return 0.5;
  // Calculate luminance (0 = dark, 1 = light)
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}