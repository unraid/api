import { config } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterAll, beforeAll } from 'vitest';

// Configure Vue Test Utils
config.global.plugins = [createTestingPinia()];

// Add any global test setup here
beforeAll(() => {
  // Add any global setup code here
});

afterAll(() => {
  // Add any global cleanup code here
});
