/**
 * Theme store test coverage
 */

import { createApp, nextTick, ref } from 'vue';
import { setActivePinia } from 'pinia';

import { defaultColors } from '~/themes/default';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { globalPinia } from '~/store/globalPinia';
import { useThemeStore } from '~/store/theme';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref(null),
    loading: ref(false),
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
  useLazyQuery: () => ({
    load: vi.fn(),
    result: ref(null),
    loading: ref(false),
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@unraid/ui', () => ({
  isDarkModeActive: vi.fn(() => {
    if (typeof document === 'undefined') return false;
    const cssVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-dark-mode')
      .trim();
    if (cssVar === '1') return true;
    if (cssVar === '0') return false;
    if (document.documentElement.classList.contains('dark')) return true;
    if (document.body?.classList.contains('dark')) return true;
    if (document.querySelector('.unapi.dark')) return true;
    return false;
  }),
}));

describe('Theme Store', () => {
  const originalAddClassFn = document.body.classList.add;
  const originalRemoveClassFn = document.body.classList.remove;
  const originalStyleCssText = document.body.style.cssText;
  const originalDocumentElementAddClass = document.documentElement.classList.add;
  const originalDocumentElementRemoveClass = document.documentElement.classList.remove;

  let store: ReturnType<typeof useThemeStore> | undefined;
  let app: ReturnType<typeof createApp> | undefined;

  beforeEach(() => {
    app = createApp({ render: () => null });
    app.use(globalPinia);
    setActivePinia(globalPinia);
    store = undefined;
    window.localStorage.clear();
    delete (globalPinia.state.value as Record<string, unknown>).theme;

    document.body.classList.add = vi.fn();
    document.body.classList.remove = vi.fn();
    document.body.style.cssText = '';
    document.documentElement.classList.add = vi.fn();
    document.documentElement.classList.remove = vi.fn();
    document.documentElement.style.removeProperty('--theme-dark-mode');
    document.documentElement.style.removeProperty('--theme-name');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.querySelectorAll('.unapi').forEach((el) => el.classList.remove('dark'));

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    store?.$dispose();
    store = undefined;
    if (app) {
      try {
        app.unmount();
      } catch {
        // App was not mounted, ignore
      }
    }
    app = undefined;

    document.body.classList.add = originalAddClassFn;
    document.body.classList.remove = originalRemoveClassFn;
    document.body.style.cssText = originalStyleCssText;
    document.documentElement.classList.add = originalDocumentElementAddClass;
    document.documentElement.classList.remove = originalDocumentElementRemoveClass;
    vi.restoreAllMocks();
  });

  const createStore = () => {
    if (!store) {
      store = useThemeStore();
    }

    return store;
  };

  describe('State and Initialization', () => {
    it('should initialize with default theme', () => {
      const store = createStore();

      expect(store.theme).toEqual({
        name: 'white',
        banner: false,
        bannerGradient: false,
        bgColor: '',
        descriptionShow: false,
        metaColor: '',
        textColor: '',
      });
      expect(store.activeColorVariables).toEqual(defaultColors.white);
    });

    it('should compute darkMode from CSS variable when set to 1', () => {
      document.documentElement.style.setProperty('--theme-dark-mode', '1');
      const store = createStore();
      expect(store.darkMode).toBe(true);
    });

    it('should compute darkMode from CSS variable when set to 0', () => {
      document.documentElement.style.setProperty('--theme-dark-mode', '0');
      const store = createStore();
      expect(store.darkMode).toBe(false);
    });

    it('should compute bannerGradient from CSS variable when set', async () => {
      document.documentElement.style.setProperty('--theme-dark-mode', '0');
      document.documentElement.style.setProperty(
        '--banner-gradient',
        'linear-gradient(90deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.7) var(--banner-gradient-stop, 30%))'
      );

      const store = createStore();
      store.setTheme({ banner: true, bannerGradient: true });
      await nextTick();
      expect(store.theme.banner).toBe(true);
      expect(store.theme.bannerGradient).toBe(true);
      expect(store.darkMode).toBe(false);
      expect(store.bannerGradient).toBe(
        'background-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.7) var(--banner-gradient-stop, 30%));'
      );
    });

    it('should return undefined when bannerGradient CSS variable is not set', () => {
      document.documentElement.style.removeProperty('--banner-gradient');
      const store = createStore();
      expect(store.bannerGradient).toBeUndefined();
    });
  });

  describe('Actions', () => {
    it('should set theme correctly', () => {
      const store = createStore();

      const newTheme = {
        name: 'black',
        banner: true,
        bannerGradient: true,
        bgColor: '#123456',
        descriptionShow: true,
        metaColor: '#abcdef',
        textColor: '#ffffff',
      };

      store.setTheme(newTheme);
      expect(store.theme).toEqual(newTheme);
    });

    it('should update body classes for dark mode', async () => {
      const store = createStore();

      store.setTheme({ ...store.theme, name: 'black' });

      await nextTick();

      expect(document.body.classList.add).toHaveBeenCalledWith('dark');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(store.darkMode).toBe(true);

      store.setTheme({ ...store.theme, name: 'white' });

      await nextTick();

      expect(document.body.classList.remove).toHaveBeenCalledWith('dark');
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(store.darkMode).toBe(false);
    });

    it('should update activeColorVariables when theme changes', async () => {
      const store = createStore();

      store.setTheme({
        ...store.theme,
        name: 'white',
        textColor: '#333333',
        metaColor: '#666666',
        bgColor: '#ffffff',
      });

      await nextTick();

      // activeColorVariables now contains the theme defaults from defaultColors
      // The white theme's --color-beta is a reference to var(--header-text-primary)
      expect(store.activeColorVariables['--color-beta']).toBe('var(--header-text-primary)');
    });

    it('should apply dark mode classes when theme changes', async () => {
      const store = createStore();

      store.setTheme({
        ...store.theme,
        name: 'black',
      });

      await nextTick();

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(document.body.classList.add).toHaveBeenCalledWith('dark');
      expect(store.darkMode).toBe(true);
    });

    it('should update darkMode reactively when theme changes', async () => {
      const store = createStore();

      expect(store.darkMode).toBe(false);

      store.setTheme({
        ...store.theme,
        name: 'gray',
      });

      await nextTick();

      expect(store.darkMode).toBe(true);

      store.setTheme({
        ...store.theme,
        name: 'white',
      });

      await nextTick();

      expect(store.darkMode).toBe(false);
    });

    it('should initialize dark mode from CSS variable on store creation', () => {
      // Mock getComputedStyle to return dark mode
      const originalGetComputedStyle = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '1';
              }
              if (prop === '--theme-name') {
                return 'black';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      document.documentElement.style.setProperty('--theme-dark-mode', '1');
      const store = createStore();

      // Should have added dark class to documentElement and body
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(document.body.classList.add).toHaveBeenCalledWith('dark');
      expect(store.darkMode).toBe(true);

      vi.restoreAllMocks();
    });
  });
});
