import { config } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterAll, beforeAll, vi } from 'vitest';

// Import mocks
import './mocks/pinia.ts';
import './mocks/shared-callbacks.ts';
import './mocks/ui-components.ts';
import './mocks/stores/index.ts';
import './mocks/services/index.ts';

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

// Global setup and cleanup
beforeAll(() => {});
afterAll(() => {});
