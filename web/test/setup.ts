import { config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { afterAll, beforeAll, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestApolloClient } from './mocks/apollo-client';

// Mock shared callbacks
vi.mock('@unraid/shared-callbacks', () => ({
  default: {
    encrypt: (data: string) => data,
    decrypt: (data: string) => data,
  },
}));

// Configure Vue Test Utils
config.global.plugins = [
  createTestingPinia({
    createSpy: vi.fn,
  }),
];

// Create a basic i18n instance for testing
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'auth.button.title': 'Authenticate',
      'auth.button.text': 'Click to authenticate',
      'auth.error.message': 'Authentication failed',
    },
  },
});

config.global.plugins.push(i18n);

// Create and configure Apollo client for testing
createTestApolloClient();

// Increase test timeout
vi.setConfig({ testTimeout: 10000 });

// Global setup
beforeAll(() => {
  // Add any global setup here
});

// Global cleanup
afterAll(() => {
  // Add any global cleanup here
});
