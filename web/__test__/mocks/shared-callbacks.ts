import { vi } from 'vitest';

import type { SendPayloads } from '@unraid/shared-callbacks';

/**
 * Mock for @unraid/shared-callbacks module
 *
 * This provides a simple implementation for testing purposes
 */
vi.mock('@unraid/shared-callbacks', () => ({
  // Mock for default export
  default: {
    encrypt: vi.fn((data: string) => data),
    decrypt: vi.fn((data: string) => data),
  },

  // Mock for ExternalSignIn and ExternalSignOut types
  // These are used as interfaces only so no implementation needed

  // Mock for useCallback hook
  useCallback: vi.fn(({ encryptionKey: _encryptionKey }: { encryptionKey: string }) => {
    return {
      send: vi.fn((_url: string, _payload: SendPayloads, _mode?: string, _type?: string) => {
        return Promise.resolve();
      }),
      watcher: vi.fn(() => null),
    };
  }),
}));

// Mock the crypto-js/aes module which is used by shared-callbacks
vi.mock('crypto-js/aes.js', () => ({
  default: {
    encrypt: vi.fn((data: string, _key: string) => ({
      toString: () => data,
    })),
    decrypt: vi.fn((data: string, _key: string) => ({
      toString: () => data,
    })),
  },
}));
