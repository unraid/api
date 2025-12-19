/**
 * UpdateOs store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { WEBGUI_REDIRECT } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateOsStore } from '~/store/updateOs';

const mockSend = vi.fn();

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: mockSend,
    watcher: vi.fn(),
  })),
}));

vi.mock('~/composables/preventClose', () => ({
  addPreventClose: vi.fn(),
  removePreventClose: vi.fn(),
}));

vi.mock('~/store/account', () => ({
  useAccountStore: () => ({
    accountActionStatus: 'ready',
  }),
}));

vi.mock('~/store/installKey', () => ({
  useInstallKeyStore: () => ({
    keyInstallStatus: 'ready',
  }),
}));

vi.mock('~/store/updateOsActions', () => ({
  useUpdateOsActionsStore: () => ({}),
}));

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
      expect(store.updateOsModalVisible).toBe(false);
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
      expect(store.updateOsModalVisible).toBe(true);
    });

    it('should set modal open state', () => {
      store.setModalOpen(true);
      expect(store.updateOsModalVisible).toBe(true);

      store.setModalOpen(false);
      expect(store.updateOsModalVisible).toBe(false);
    });

    it('should send update install through redirect.htm', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...originalLocation,
          origin: 'https://littlebox.tail45affd.ts.net',
          href: 'https://littlebox.tail45affd.ts.net/Plugins',
        },
      });

      store.fetchAndConfirmInstall('test-sha256');

      const expectedUrl = new URL(WEBGUI_REDIRECT, window.location.origin).toString();

      expect(mockSend).toHaveBeenCalledWith(
        expectedUrl,
        [
          {
            sha256: 'test-sha256',
            type: 'updateOs',
          },
        ],
        undefined,
        'forUpc'
      );

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('should handle errors when checking for updates', async () => {
      const { WebguiCheckForUpdate } = await import('~/composables/services/webgui');

      vi.mocked(WebguiCheckForUpdate).mockRejectedValueOnce(new Error('Network error'));

      await expect(store.localCheckForUpdate()).rejects.toThrow(
        '[localCheckForUpdate] Error checking for updates'
      );

      expect(WebguiCheckForUpdate).toHaveBeenCalled();
    });

    it('should successfully cancel an update', async () => {
      const { WebguiUpdateCancel } = await import('~/composables/services/webgui');
      const originalLocation = window.location;
      const mockReload = vi.fn();

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...originalLocation,
          pathname: '/some/other/path',
          reload: mockReload,
        },
      });

      vi.mocked(WebguiUpdateCancel).mockResolvedValueOnce({ success: true });

      await store.cancelUpdate();

      expect(WebguiUpdateCancel).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('should redirect to /Tools when cancelling update from /Tools/Update path', async () => {
      const { WebguiUpdateCancel } = await import('~/composables/services/webgui');
      const originalLocation = window.location;
      let hrefValue = '';

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...originalLocation,
          pathname: '/Tools/Update',
          get href() {
            return hrefValue;
          },
          set href(value) {
            hrefValue = value;
          },
        },
      });

      vi.mocked(WebguiUpdateCancel).mockResolvedValueOnce({ success: true });

      await store.cancelUpdate();

      expect(WebguiUpdateCancel).toHaveBeenCalled();
      expect(hrefValue).toBe('/Tools');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('should throw an error when cancel update is unsuccessful', async () => {
      const { WebguiUpdateCancel } = await import('~/composables/services/webgui');

      vi.mocked(WebguiUpdateCancel).mockResolvedValueOnce({ success: false });

      await expect(store.cancelUpdate()).rejects.toThrow('Unable to cancel update');

      expect(WebguiUpdateCancel).toHaveBeenCalled();
    });

    it('should throw an error when WebguiUpdateCancel fails', async () => {
      const { WebguiUpdateCancel } = await import('~/composables/services/webgui');

      vi.mocked(WebguiUpdateCancel).mockRejectedValueOnce(new Error('API error'));

      await expect(store.cancelUpdate()).rejects.toThrow(
        '[cancelUpdate] Error cancelling update with error: API error'
      );

      expect(WebguiUpdateCancel).toHaveBeenCalled();
    });
  });
});
