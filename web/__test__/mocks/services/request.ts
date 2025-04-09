import { vi } from 'vitest';

// Mock any composables that might cause hanging
vi.mock('~/composables/services/request', () => {
  return {
    useRequest: vi.fn(() => ({
      post: vi.fn(() => Promise.resolve({ data: {} })),
      get: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    // Add the url function that's used by WebguiInstallKey
    url: vi.fn((path) => path),
    request: {
      url: vi.fn((path) => path),
    },
  };
});
