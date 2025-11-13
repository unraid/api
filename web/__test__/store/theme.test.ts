/**
 * Theme store test coverage
 */

import { createApp, nextTick, ref } from 'vue';
import { setActivePinia } from 'pinia';

import { defaultColors } from '~/themes/default';
import hexToRgba from 'hex-to-rgba';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Theme } from '~/themes/types';

import { globalPinia } from '~/store/globalPinia';
import { THEME_STORAGE_KEY, useThemeStore } from '~/store/theme';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref(null),
    loading: ref(false),
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('hex-to-rgba', () => ({
  default: vi.fn((hex, opacity) => `rgba(mock-${hex}-${opacity})`),
}));

describe('Theme Store', () => {
  const originalAddClassFn = document.body.classList.add;
  const originalRemoveClassFn = document.body.classList.remove;
  const originalStyleCssText = document.body.style.cssText;
  const originalDocumentElementSetProperty = document.documentElement.style.setProperty;
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
    document.documentElement.style.setProperty = vi.fn();
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
    document.documentElement.style.setProperty = originalDocumentElementSetProperty;
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

      expect(typeof store.$persist).toBe('function');

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

    it('should compute darkMode correctly', () => {
      const store = createStore();

      expect(store.darkMode).toBe(false);

      store.setTheme({ ...store.theme, name: 'black' });
      expect(store.darkMode).toBe(true);

      store.setTheme({ ...store.theme, name: 'gray' });
      expect(store.darkMode).toBe(true);

      store.setTheme({ ...store.theme, name: 'white' });
      expect(store.darkMode).toBe(false);
    });

    it('should compute bannerGradient correctly', () => {
      const store = createStore();

      expect(store.bannerGradient).toBeUndefined();

      store.setTheme({
        ...store.theme,
        banner: true,
        bannerGradient: true,
      });
      expect(store.bannerGradient).toMatchInlineSnapshot(
        `"background-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 0, var(--header-background-color) 90%);"`
      );

      store.setTheme({
        ...store.theme,
        banner: true,
        bannerGradient: true,
        bgColor: '#123456',
      });
      expect(store.bannerGradient).toMatchInlineSnapshot(
        `"background-image: linear-gradient(90deg, var(--header-gradient-start) 0, var(--header-gradient-end) 90%);"`
      );
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
      // Custom values are applied as CSS variables on the documentElement
      // The white theme's --color-beta is a reference to var(--header-text-primary)
      expect(store.activeColorVariables['--color-beta']).toBe('var(--header-text-primary)');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--custom-header-text-primary',
        '#333333'
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--custom-header-text-secondary',
        '#666666'
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--custom-header-background-color',
        '#ffffff'
      );
    });

    it('should handle banner gradient correctly', async () => {
      const store = createStore();
      const mockHexToRgba = vi.mocked(hexToRgba);

      mockHexToRgba.mockClear();

      store.setTheme({
        ...store.theme,
        banner: true,
        bannerGradient: true,
        bgColor: '#112233',
      });

      await nextTick();

      expect(mockHexToRgba).toHaveBeenCalledWith('#112233', 0);
      expect(mockHexToRgba).toHaveBeenCalledWith('#112233', 0.7);

      // Banner gradient values are now set as custom CSS variables on documentElement
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--custom-header-gradient-start',
        'rgba(mock-#112233-0)'
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--custom-header-gradient-end',
        'rgba(mock-#112233-0.7)'
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--banner-gradient',
        'linear-gradient(90deg, rgba(mock-#112233-0) 0, rgba(mock-#112233-0.7) 90%)'
      );
    });

    it('should hydrate theme from cache when available', () => {
      const cachedTheme = {
        name: 'black',
        banner: true,
        bannerGradient: false,
        bgColor: '#222222',
        descriptionShow: true,
        metaColor: '#aaaaaa',
        textColor: '#ffffff',
      } satisfies Theme;

      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme: cachedTheme }));

      const store = createStore();

      expect(store.theme).toEqual(cachedTheme);
    });

    it('should persist server theme responses to cache', async () => {
      const store = createStore();

      const serverTheme = {
        name: 'gray',
        banner: false,
        bannerGradient: false,
        bgColor: '#111111',
        descriptionShow: false,
        metaColor: '#999999',
        textColor: '#eeeeee',
      } satisfies Theme;

      store.setTheme(serverTheme, { source: 'server' });
      await nextTick();

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toEqual(
        JSON.stringify({ theme: serverTheme })
      );
    });
  });
});
