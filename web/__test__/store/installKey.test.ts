/**
 * InstallKey store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalKeyActions } from '@unraid/shared-callbacks';

import { useInstallKeyStore } from '~/store/installKey';

const mockGetFn = vi.fn();
vi.mock('~/composables/services/webgui', () => ({
  WebguiInstallKey: {
    query: vi.fn(() => ({
      get: mockGetFn,
    })),
  },
}));

const mockSetError = vi.fn();
vi.mock('~/store/errors', () => ({
  useErrorsStore: () => ({
    setError: mockSetError,
  }),
}));

vi.mock('@unraid/shared-callbacks', () => ({}));
const createTestAction = (data: Partial<ExternalKeyActions>): ExternalKeyActions => {
  return {
    type: 'purchase',
    keyUrl: '',
    ...data,
  };
};

describe('InstallKey Store', () => {
  let store: ReturnType<typeof useInstallKeyStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInstallKeyStore();

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  describe('State and Initialization', () => {
    it('should initialize with default state', () => {
      expect(store.keyInstallStatus).toBe('ready');
      expect(store.keyActionType).toBeUndefined();
      expect(store.keyType).toBeUndefined();
      expect(store.keyUrl).toBeUndefined();
    });
  });

  describe('Installing Keys', () => {
    it('should fail when keyUrl is not provided', async () => {
      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: undefined,
        })
      );

      expect(store.keyInstallStatus).toBe('failed');
      expect(console.error).toHaveBeenCalledWith('[install] no key to install');
    });

    it('should set status to installing when install is called', async () => {
      mockGetFn.mockResolvedValueOnce({ success: true });

      const promise = store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyInstallStatus).toBe('installing');

      await promise;
    });

    it('should call WebguiInstallKey.query with correct url', async () => {
      mockGetFn.mockResolvedValueOnce({ success: true });

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyInstallStatus).toBe('success');
    });

    it('should extract key type from .key URL', async () => {
      mockGetFn.mockResolvedValueOnce({ success: true });

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyType).toBe('license');
    });

    it('should extract key type from .unkey URL', async () => {
      mockGetFn.mockResolvedValueOnce({ success: true });

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/premium.unkey',
        })
      );

      expect(store.keyType).toBe('premium');
    });
  });

  describe('Error Handling', () => {
    it('should handle string errors during installation', async () => {
      mockGetFn.mockRejectedValueOnce('error message');

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyInstallStatus).toBe('failed');
      expect(mockSetError).toHaveBeenCalledWith({
        heading: 'Failed to install key',
        message: 'ERROR MESSAGE',
        level: 'error',
        ref: 'installKey',
        type: 'installKey',
      });
    });

    it('should handle Error object during installation', async () => {
      mockGetFn.mockRejectedValueOnce(new Error('Test error message'));

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyInstallStatus).toBe('failed');
      expect(mockSetError).toHaveBeenCalledWith({
        heading: 'Failed to install key',
        message: 'Test error message',
        level: 'error',
        ref: 'installKey',
        type: 'installKey',
      });
    });

    it('should handle unknown error types during installation', async () => {
      mockGetFn.mockRejectedValueOnce({ something: 'wrong' });

      await store.install(
        createTestAction({
          type: 'purchase',
          keyUrl: 'https://example.com/license.key',
        })
      );

      expect(store.keyInstallStatus).toBe('failed');
      expect(mockSetError).toHaveBeenCalledWith({
        heading: 'Failed to install key',
        message: 'Unknown error',
        level: 'error',
        ref: 'installKey',
        type: 'installKey',
      });
    });
  });
});
