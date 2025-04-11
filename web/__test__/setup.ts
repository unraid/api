import { config } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

// Import mocks
import './mocks/ui-components.js';

// Configure Vue Test Utils
config.global.plugins = [
  createTestingPinia({
    createSpy: vi.fn,
  }),
  // Simple mock for i18n
  {
    install: vi.fn(),
  },
];

// Set a timeout for tests
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Mock fetch
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
);
