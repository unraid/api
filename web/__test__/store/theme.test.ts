/**
 * Theme store test coverage
 */

import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { defaultColors } from '~/themes/default';
import hexToRgba from 'hex-to-rgba';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from '~/store/theme';

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
  let store: ReturnType<typeof useThemeStore>;
  const originalAddClassFn = document.body.classList.add;
  const originalRemoveClassFn = document.body.classList.remove;
  const originalStyleCssText = document.body.style.cssText;
  const originalDocumentElementSetProperty = document.documentElement.style.setProperty;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useThemeStore();

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
    // Restore original methods
    document.body.classList.add = originalAddClassFn;
    document.body.classList.remove = originalRemoveClassFn;
    document.body.style.cssText = originalStyleCssText;
    document.documentElement.style.setProperty = originalDocumentElementSetProperty;
    vi.restoreAllMocks();
  });

  describe('State and Initialization', () => {
    it('should initialize with default theme', () => {
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
      expect(store.darkMode).toBe(false);

      store.setTheme({ ...store.theme, name: 'black' });
      expect(store.darkMode).toBe(true);

      store.setTheme({ ...store.theme, name: 'gray' });
      expect(store.darkMode).toBe(true);

      store.setTheme({ ...store.theme, name: 'white' });
      expect(store.darkMode).toBe(false);
    });

    it('should compute bannerGradient correctly', () => {
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
      store.setTheme({ ...store.theme, name: 'black' });

      await nextTick();

      expect(document.body.classList.add).toHaveBeenCalledWith('dark');

      store.setTheme({ ...store.theme, name: 'white' });

      await nextTick();

      expect(document.body.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should update activeColorVariables when theme changes', async () => {
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
  });
});
