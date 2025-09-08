import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, vi } from 'vitest';

// Mock WebSocket for test environment
if (!global.WebSocket) {
  const mockWebSocket = vi.fn().mockImplementation(() => ({
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

  // Add static properties to match WebSocket interface
  Object.defineProperty(mockWebSocket, 'CONNECTING', { value: 0 });
  Object.defineProperty(mockWebSocket, 'OPEN', { value: 1 });
  Object.defineProperty(mockWebSocket, 'CLOSING', { value: 2 });
  Object.defineProperty(mockWebSocket, 'CLOSED', { value: 3 });

  global.WebSocket = mockWebSocket as unknown as typeof WebSocket;
}

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
});
