import { vi } from 'vitest';

// Mock vue-i18n
vi.mock('vue-i18n', () => {
  return {
    useI18n: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'auth.button.title': 'Authenticate',
          'auth.button.text': 'Click to authenticate',
          'auth.error.message': 'Authentication failed',
        };
        return translations[key] || key;
      },
      locale: { value: 'en' },
    }),
    createI18n: () => ({
      install: vi.fn(),
      global: {
        t: (key: string) => key,
      },
    }),
  };
});
