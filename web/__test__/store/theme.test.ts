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

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    store?.$dispose();
    store = undefined;
    app?.unmount();
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
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      const store = createStore();
      expect(store.darkMode).toBe(true);

      vi.restoreAllMocks();
    });

    it('should compute darkMode from CSS variable when set to 0', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '0';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      const store = createStore();
      expect(store.darkMode).toBe(false);

      vi.restoreAllMocks();
    });

    it('should compute bannerGradient from CSS variable when set', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--banner-gradient') {
                return 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.7) 90%)';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      const store = createStore();
      expect(store.bannerGradient).toBe(
        'background-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.7) 90%);'
      );

      vi.restoreAllMocks();
    });

    it('should return undefined when bannerGradient CSS variable is not set', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--banner-gradient') {
                return '';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      const store = createStore();
      expect(store.bannerGradient).toBeUndefined();

      vi.restoreAllMocks();
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

      store.setTheme({ ...store.theme, name: 'white' });

      await nextTick();

      expect(document.body.classList.remove).toHaveBeenCalledWith('dark');
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

      createStore();

      // Should have added dark class to documentElement and body
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(document.body.classList.add).toHaveBeenCalledWith('dark');

      vi.restoreAllMocks();
    });
  });
});
