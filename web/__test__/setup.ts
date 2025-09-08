import { config } from '@vue/test-utils';

import { vi } from 'vitest';

// Import mocks
import '@/../__test__/mocks/ui-components.js';

// Configure Vue Test Utils
config.global.plugins = [
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
