import { vi } from 'vitest';
import type { SendPayloads } from '@unraid/shared-callbacks';

// Mock implementation of the shared-callbacks module
export const mockSharedCallbacks = {
  encrypt: (data: string, _key: string) => {
    return data; // Simple mock that returns the input data
  },
  decrypt: (data: string, _key: string) => {
    return data; // Simple mock that returns the input data
  },
  useCallback: ({ encryptionKey: _encryptionKey }: { encryptionKey: string }) => {
    return {
      send: (_payload: SendPayloads) => {
        return Promise.resolve();
      },
      watcher: () => {
        return null;
      }
    };
  }
};

// Mock the crypto-js/aes module
vi.mock('crypto-js/aes.js', () => ({
  default: {
    encrypt: (data: string, _key: string) => {
      return { toString: () => data };
    },
    decrypt: (data: string, _key: string) => {
      return { toString: () => data };
    }
  }
})); 