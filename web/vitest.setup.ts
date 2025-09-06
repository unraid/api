import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, vi } from 'vitest';

// Mock WebSocket for test environment
if (!global.WebSocket) {
  global.WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  }));
}

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
});
