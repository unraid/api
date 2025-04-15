/**
 * UpdateOsChangelog store test coverage
 */

import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerUpdateOsResponse } from '~/types/server';

import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

vi.mock('~/helpers/markdown', () => ({
  Markdown: {
    create: () => ({
      setOptions: vi.fn(),
      parse: vi.fn().mockResolvedValue('<h1>Test Title</h1><p>Test content</p>'),
    }),
  },
}));

vi.mock('~/helpers/urls', () => ({
  DOCS_RELEASE_NOTES: {
    toString: () => 'https://docs.unraid.net/unraid-os/release-notes/',
  },
}));

vi.mock('marked-base-url', () => ({
  baseUrl: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('semver/functions/prerelease', () => ({
  default: vi
    .fn()
    .mockImplementation((version) => (version && version.includes('-') ? ['beta', '1'] : null)),
}));

const mockRequestText = vi.fn().mockResolvedValue('# Test Changelog\n\nTest content');
vi.mock('~/composables/services/request', () => ({
  request: {
    url: () => ({
      get: () => ({
        text: mockRequestText,
      }),
    }),
  },
}));

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

    // Suppress console output
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Store API', () => {
    it('should initialize with default values', () => {
      expect(store.releaseForUpdate).toBeNull();
      expect(store.parseChangelogFailed).toBe('');
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

      expect(typeof store.isReleaseForUpdateStable).toBe('boolean');

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

    it('should have computed properties for changelog display', async () => {
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);

      expect(typeof store.mutatedParsedChangelog).toBe('string');
      expect(typeof store.parsedChangelogTitle).toBe('string');
    });

    it('should clear changelog data when release is set to null', () => {
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);

      store.setReleaseForUpdate(null);

      expect(store.releaseForUpdate).toBeNull();
      expect(store.parseChangelogFailed).toBe('');
    });

    it('should handle state transitions when changing releases', () => {
      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);

      const differentRelease = {
        ...mockStableRelease,
        version: '6.12.6',
      };
      store.setReleaseForUpdate(differentRelease as ServerUpdateOsResponse);

      expect(store.releaseForUpdate).toEqual(differentRelease);
    });

    it('should have proper error handling for failed requests', async () => {
      mockRequestText.mockRejectedValueOnce(new Error('Network error'));

      store.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(typeof store.parseChangelogFailed).toBe('string');
    });

    it('should fetch and parse changelog when releaseForUpdate changes', async () => {
      const internalStore = useUpdateOsChangelogStore();

      vi.clearAllMocks();

      internalStore.setReleaseForUpdate(mockStableRelease as ServerUpdateOsResponse);

      await nextTick();

      expect(mockRequestText).toHaveBeenCalled();

      mockRequestText.mockClear();

      const differentRelease = {
        ...mockStableRelease,
        version: '6.12.6',
        changelog: 'https://example.com/different-changelog.md',
      };

      internalStore.setReleaseForUpdate(differentRelease as ServerUpdateOsResponse);

      await nextTick();

      expect(mockRequestText).toHaveBeenCalled();

      mockRequestText.mockClear();

      internalStore.setReleaseForUpdate(null);

      await nextTick();

      expect(mockRequestText).not.toHaveBeenCalled();
    });
  });
});
