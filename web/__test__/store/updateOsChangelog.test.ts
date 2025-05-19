/**
 * UpdateOsChangelog store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerUpdateOsResponse } from '~/types/server';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

const mockSend = vi.fn();
vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    send: mockSend,
  }),
}));

const mockStableRelease: Partial<ServerUpdateOsResponse> = {
  version: '6.12.5',
  name: 'Unraid 6.12.5',
  date: '2023-10-15',
  isEligible: true,
  isNewer: true,
  changelog: 'https://example.com/changelog.md',
  changelogPretty: 'https://example.com/changelog',
  sha256: 'test-sha256',
};

const mockBetaRelease: Partial<ServerUpdateOsResponse> = {
  ...mockStableRelease,
  version: '6.12.5-beta1',
};

describe('UpdateOsChangelog Store', () => {
  let store: ReturnType<typeof useUpdateOsChangelogStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUpdateOsChangelogStore();
    vi.clearAllMocks();
  });

  describe('Store API', () => {
    it('should initialize with default values', () => {
      expect(store.releaseForUpdate).toBeNull();
    });

    it('should set and get releaseForUpdate', () => {
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);
      expect(store.releaseForUpdate).toEqual(mockStableRelease);

      store.setReleaseForUpdate(null);
      expect(store.releaseForUpdate).toBeNull();
    });

    it('should determine if release is stable', () => {
      expect(store.isReleaseForUpdateStable).toBe(false);
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);
      expect(store.isReleaseForUpdateStable).toBe(true);
      store.setReleaseForUpdate(mockBetaRelease as ServerUpdateOsResponse);
      expect(store.isReleaseForUpdateStable).toBe(false);
    });

    it('should have a method to fetch and confirm install', () => {
      store.fetchAndConfirmInstall('test-sha256');
      expect(mockSend).toHaveBeenCalledWith(
        expect.any(String),
        [
          {
            sha256: 'test-sha256',
            type: 'updateOs',
          },
        ],
        undefined,
        'forUpc'
      );
    });

    it('should expose changelogUrl and changelogPretty', () => {
      expect(store.changelogUrl).toBe('');
      expect(store.changelogPretty).toBeNull();
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);
      expect(store.changelogUrl).toBe('https://example.com/changelog.md');
      expect(store.changelogPretty).toBe('https://example.com/changelog');
    });
  });
});
