import { vi } from 'vitest';

// Mock the server store which is used by Auth component
vi.mock('~/store/server', () => {
  return {
    useServerStore: vi.fn(() => ({
      authAction: 'authenticate',
      stateData: { error: false, message: '' },
      authToken: 'mock-token',
      isAuthenticated: true,
      authenticate: vi.fn(() => Promise.resolve()),
      logout: vi.fn(),
      resetAuth: vi.fn(),
    })),
  };
});
