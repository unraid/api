/**
 * UpdateOs store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateOsStore } from '~/store/updateOs';

// Mock the WebGUI services
vi.mock('~/composables/services/webgui', () => {
  return {
    WebguiCheckForUpdate: vi.fn().mockResolvedValue({
      version: '6.12.0',
      name: 'Unraid 6.12.0',
      isNewer: true,
      isEligible: true,
      date: '2023-01-01',
      sha256: 'test-sha256',
      changelog: 'https://example.com/changelog',
    }),
    WebguiUpdateCancel: vi.fn().mockResolvedValue({ success: true }),
  };
});

// Mock the server store
vi.mock('~/store/server', () => {
  return {
    useServerStore: () => ({
      regExp: '2025-01-01',
      regUpdatesExpired: false,
      updateOsResponse: {
        version: '6.12.0',
        name: 'Unraid 6.12.0',
        isNewer: true,
        isEligible: true,
        date: '2023-01-01',
        sha256: 'test-sha256',
        changelog: 'https://example.com/changelog',
      },
      updateOsIgnoredReleases: [],
      setUpdateOsResponse: vi.fn(),
    }),
  };
});

// Mock console.debug to prevent noise in tests
console.debug = vi.fn();

describe('UpdateOs Store', () => {
  let store: ReturnType<typeof useUpdateOsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUpdateOsStore();
    vi.clearAllMocks();
  });

  describe('State and Getters', () => {
    it('should initialize with correct default values', () => {
      expect(store.checkForUpdatesLoading).toBe(false);
      expect(store.modalOpen).toBe(false);
    });

    it('should have computed properties with the right types', () => {
      // Test that properties exist with the right types
      expect(typeof store.available).not.toBe('undefined');
      expect(typeof store.availableRequiresAuth).toBe('boolean');
    });
  });

  describe('Actions', () => {
    it('should check for updates and update state', async () => {
      const { WebguiCheckForUpdate } = await import('~/composables/services/webgui');

      // Mock the method to avoid the error
      vi.mocked(WebguiCheckForUpdate).mockResolvedValueOnce({
        version: '6.12.0',
        name: 'Unraid 6.12.0',
        isNewer: true,
        isEligible: true,
        date: '2023-01-01',
        sha256: 'test-sha256',
        changelog: 'https://example.com/changelog',
      });

      await store.localCheckForUpdate();

      expect(WebguiCheckForUpdate).toHaveBeenCalled();
      expect(store.modalOpen).toBe(true);
    });

    it('should set modal open state', () => {
      store.setModalOpen(true);
      expect(store.modalOpen).toBe(true);

      store.setModalOpen(false);
      expect(store.modalOpen).toBe(false);
    });
  });
});
