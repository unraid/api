/**
 * Singleton theme initializer
 * Ensures theme is only initialized once per page, regardless of multiple Vue containers
 */

import { useThemeStore } from '@/store/theme';

let isThemeInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize theme store once per page load
 * Returns a promise that resolves when theme is initialized
 */
export async function initializeTheme(): Promise<void> {
  // If already initialized, return immediately
  if (isThemeInitialized) {
    return Promise.resolve();
  }

  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      const themeStore = useThemeStore();

      // Load theme from GraphQL
      await themeStore.fetchTheme();

      isThemeInitialized = true;

      console.debug('[ThemeInitializer] Theme initialized successfully');
    } catch (error) {
      console.error('[ThemeInitializer] Failed to initialize theme:', error);
      // Even on error, mark as initialized to prevent infinite retries
      isThemeInitialized = true;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Check if theme has been initialized
 */
export function isThemeReady(): boolean {
  return isThemeInitialized;
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetThemeInitialization(): void {
  isThemeInitialized = false;
  initializationPromise = null;
}

// Expose on window for debugging
if (typeof window !== 'undefined') {
  (window as Window & { __themeInitializer?: object }).__themeInitializer = {
    isReady: isThemeReady,
    reset: resetThemeInitialization,
    initialize: initializeTheme,
  };
}
