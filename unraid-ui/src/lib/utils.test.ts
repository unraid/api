import { isDarkModeActive } from '@/lib/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('isDarkModeActive', () => {
  const originalGetComputedStyle = window.getComputedStyle;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.removeProperty('--theme-dark-mode');
    document.querySelectorAll('.unapi').forEach((el) => el.classList.remove('dark'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.removeProperty('--theme-dark-mode');
    document.querySelectorAll('.unapi').forEach((el) => el.classList.remove('dark'));
  });

  describe('CSS variable detection', () => {
    it('should return true when CSS variable is set to "1"', () => {
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

      expect(isDarkModeActive()).toBe(true);
    });

    it('should return false when CSS variable is set to "0"', () => {
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

      expect(isDarkModeActive()).toBe(false);
    });

    it('should return false when CSS variable is explicitly "0" even if dark class exists', () => {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');

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

      expect(isDarkModeActive()).toBe(false);
    });
  });

  describe('ClassList detection fallback', () => {
    it('should return true when documentElement has dark class and CSS variable is not set', () => {
      document.documentElement.classList.add('dark');

      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      expect(isDarkModeActive()).toBe(true);
    });

    it('should return true when body has dark class and CSS variable is not set', () => {
      document.body.classList.add('dark');

      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      expect(isDarkModeActive()).toBe(true);
    });

    it('should return true when .unapi.dark element exists and CSS variable is not set', () => {
      const unapiElement = document.createElement('div');
      unapiElement.className = 'unapi dark';
      document.body.appendChild(unapiElement);

      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      expect(isDarkModeActive()).toBe(true);

      unapiElement.remove();
    });

    it('should return false when no dark indicators are present', () => {
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
        const style = originalGetComputedStyle(el);
        if (el === document.documentElement) {
          return {
            ...style,
            getPropertyValue: (prop: string) => {
              if (prop === '--theme-dark-mode') {
                return '';
              }
              return style.getPropertyValue(prop);
            },
          } as CSSStyleDeclaration;
        }
        return style;
      });

      expect(isDarkModeActive()).toBe(false);
    });
  });

  describe('SSR/Node environment', () => {
    it('should return false when document is undefined', () => {
      const originalDocument = global.document;
      // @ts-expect-error - intentionally removing document for SSR test
      global.document = undefined;

      expect(isDarkModeActive()).toBe(false);

      global.document = originalDocument;
    });
  });
});
