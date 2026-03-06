/**
 * UpdateOsActions store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalUpdateOsAction } from '@unraid/shared-callbacks';
import type { Release } from '~/store/updateOsActions';

import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { testTranslate } from '../utils/i18n';

vi.mock('~/helpers/urls', () => ({
  WEBGUI_TOOLS_UPDATE: 'https://webgui/tools/update',
}));

const mockUpdateOs = vi.fn();
const mockInstall = vi.fn();
const mockGetOsReleaseBySha256 = vi.fn();
const mockAlert = vi.fn();
const mockDocumentSubmit = vi.fn();

vi.stubGlobal('alert', mockAlert);

const mockDocument = {};
Object.defineProperty(mockDocument, 'rebootNow', {
  value: { submit: mockDocumentSubmit },
  writable: true,
});
vi.stubGlobal('document', mockDocument);
vi.stubGlobal('openChanges', vi.fn());
vi.stubGlobal('openBox', vi.fn());

vi.mock('~/composables/installPlugin', () => ({
  default: () => ({
    install: mockInstall,
  }),
}));

vi.mock('~/composables/services/releases', () => ({
  getOsReleaseBySha256: (payload: unknown) => mockGetOsReleaseBySha256(payload),
}));

vi.mock('~/store/account', () => ({
  useAccountStore: () => ({
    updateOs: mockUpdateOs,
  }),
}));

const mockServerStore = {
  guid: 'test-guid',
  keyfile: 'test-keyfile',
  osVersion: '6.12.4',
  osVersionBranch: 'stable',
  regUpdatesExpired: false,
  regTy: 'Plus',
  locale: 'en_US' as string | undefined,
  rebootType: '',
  updateOsResponse: null as { date: string } | null,
};

vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

const mockUpdateOsStore = {
  available: '6.12.5',
  availableWithRenewal: false,
};

vi.mock('~/store/updateOs', () => ({
  useUpdateOsStore: () => mockUpdateOsStore,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: testTranslate,
  }),
}));

describe('UpdateOsActions Store', () => {
  let store: ReturnType<typeof useUpdateOsActionsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset mocks to default values
    mockServerStore.guid = 'test-guid';
    mockServerStore.keyfile = 'test-keyfile';
    mockServerStore.osVersion = '6.12.4';
    mockServerStore.osVersionBranch = 'stable';
    mockServerStore.regUpdatesExpired = false;
    mockServerStore.regTy = 'Plus';
    mockServerStore.locale = 'en_US';
    mockServerStore.rebootType = '';
    mockServerStore.updateOsResponse = null;
    mockUpdateOsStore.available = '6.12.5';
    mockUpdateOsStore.availableWithRenewal = false;

    store = useUpdateOsActionsStore();
    vi.clearAllMocks();

    // Suppress console output during tests
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      expect(store.status).toBe('ready');
      expect(store.callbackTypeDowngrade).toBe(false);
      expect(store.callbackUpdateRelease).toBeNull();
    });

    it('should set update OS action', () => {
      const action: ExternalUpdateOsAction = {
        type: 'updateOs',
        sha256: 'test-sha256',
      };

      store.setUpdateOsAction(action);

      mockGetOsReleaseBySha256.mockResolvedValue({
        version: '6.12.5',
        name: 'Test Release',
        plugin_url: 'https://example.com/plugin.plg',
      });

      return store.actOnUpdateOsAction().then(() => {
        expect(mockGetOsReleaseBySha256).toHaveBeenCalledWith({
          keyfile: 'test-keyfile',
          sha256: 'test-sha256',
        });
      });
    });

    it('should confirm update OS', () => {
      const release: Release = {
        version: '6.12.5',
        name: 'Unraid 6.12.5',
        basefile: 'unRAIDServer-6.12.5-x86_64.zip',
        date: '2023-10-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      store.confirmUpdateOs(release);

      expect(store.callbackUpdateRelease).toEqual(release);
      expect(store.status).toBe('confirming');
    });

    it('should get release from key server', async () => {
      const mockRelease: Release = {
        version: '6.12.5',
        name: 'Unraid 6.12.5',
        basefile: 'unRAIDServer-6.12.5-x86_64.zip',
        date: '2023-10-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      mockGetOsReleaseBySha256.mockResolvedValue(mockRelease);

      const result = await store.getReleaseFromKeyServer({
        keyfile: 'test-keyfile',
        sha256: 'test-sha256',
      });

      expect(mockGetOsReleaseBySha256).toHaveBeenCalledWith({
        keyfile: 'test-keyfile',
        sha256: 'test-sha256',
      });
      expect(result).toEqual(mockRelease);
    });

    it('should throw error when getting release without keyfile', async () => {
      await expect(
        store.getReleaseFromKeyServer({
          keyfile: '',
          sha256: 'test-sha256',
        })
      ).rejects.toThrow('No payload.keyfile provided');

      expect(mockGetOsReleaseBySha256).not.toHaveBeenCalled();
    });

    it('should throw error when getting release without sha256', async () => {
      await expect(
        store.getReleaseFromKeyServer({
          keyfile: 'test-keyfile',
          sha256: '',
        })
      ).rejects.toThrow('No payload.sha256 provided');
    });

    it('should throw error when getOsReleaseBySha256 fails', async () => {
      mockGetOsReleaseBySha256.mockRejectedValue(new Error('API error'));

      await expect(
        store.getReleaseFromKeyServer({
          keyfile: 'test-keyfile',
          sha256: 'test-sha256',
        })
      ).rejects.toThrow('Unable to get release from keyserver');
    });

    it('should call actOnUpdateOsAction correctly for upgrade', async () => {
      const mockRelease: Release = {
        version: '6.12.5',
        name: 'Unraid 6.12.5',
        basefile: 'unRAIDServer-6.12.5-x86_64.zip',
        date: '2023-10-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      mockGetOsReleaseBySha256.mockResolvedValue(mockRelease);

      // Set the update action first
      store.setUpdateOsAction({
        type: 'updateOs',
        sha256: 'test-sha256',
      });

      await store.actOnUpdateOsAction();

      expect(mockGetOsReleaseBySha256).toHaveBeenCalledWith({
        keyfile: 'test-keyfile',
        sha256: 'test-sha256',
      });
      expect(store.callbackTypeDowngrade).toBe(false);
      expect(store.callbackUpdateRelease).toEqual(mockRelease);
      expect(store.status).toBe('confirming');
    });

    it('should call actOnUpdateOsAction correctly for downgrade', async () => {
      const mockRelease: Release = {
        version: '6.12.3',
        name: 'Unraid 6.12.3',
        basefile: 'unRAIDServer-6.12.3-x86_64.zip',
        date: '2023-05-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      mockGetOsReleaseBySha256.mockResolvedValue(mockRelease);

      store.setUpdateOsAction({
        type: 'updateOs',
        sha256: 'test-sha256',
      });

      await store.actOnUpdateOsAction(true);

      expect(mockGetOsReleaseBySha256).toHaveBeenCalledWith({
        keyfile: 'test-keyfile',
        sha256: 'test-sha256',
      });
      expect(store.callbackTypeDowngrade).toBe(true);
      expect(store.callbackUpdateRelease).toEqual(mockRelease);
      expect(store.status).toBe('confirming');
    });

    it('should throw error when release version matches current version', async () => {
      const mockRelease: Release = {
        version: '6.12.4',
        name: 'Unraid 6.12.4',
        basefile: 'unRAIDServer-6.12.4-x86_64.zip',
        date: '2023-05-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      mockGetOsReleaseBySha256.mockResolvedValue(mockRelease);

      store.setUpdateOsAction({
        type: 'updateOs',
        sha256: 'test-sha256',
      });

      await expect(store.actOnUpdateOsAction()).rejects.toThrow(
        "Release version is the same as the server's current version"
      );
    });

    it('should throw error when release is not found', async () => {
      mockGetOsReleaseBySha256.mockResolvedValue(null);

      store.setUpdateOsAction({
        type: 'updateOs',
        sha256: 'test-sha256',
      });

      await expect(store.actOnUpdateOsAction()).rejects.toThrow('Release not found');
    });

    it('should install OS update when update release is set', () => {
      const release: Release = {
        version: '6.12.5',
        name: 'Unraid 6.12.5',
        basefile: 'unRAIDServer-6.12.5-x86_64.zip',
        date: '2023-10-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      store.confirmUpdateOs(release);
      store.installOsUpdate();

      expect(store.status).toBe('updating');
      expect(mockInstall).toHaveBeenCalledWith({
        modalTitle: 'Unraid 6.12.5 Update',
        pluginUrl: 'https://example.com/plugin.plg',
        update: false,
      });
    });

    it('should install OS downgrade when downgrade flag is set', () => {
      const release: Release = {
        version: '6.12.3',
        name: 'Unraid 6.12.3',
        basefile: 'unRAIDServer-6.12.3-x86_64.zip',
        date: '2023-05-15',
        url: 'https://example.com/download.zip',
        changelog: 'https://example.com/changelog.md',
        changelogPretty: 'https://example.com/changelog',
        md5: 'abc123',
        size: '400000000',
        sha256: 'test-sha256',
        plugin_url: 'https://example.com/plugin.plg',
        plugin_sha256: 'plugin-sha256',
        announce_url: 'https://example.com/announce',
      };

      store.confirmUpdateOs(release);
      store.callbackTypeDowngrade = true;
      store.installOsUpdate();

      expect(store.status).toBe('updating');
      expect(mockInstall).toHaveBeenCalledWith({
        modalTitle: 'Unraid 6.12.3 Downgrade',
        pluginUrl: 'https://example.com/plugin.plg',
        update: false,
      });
    });

    it('should log error when trying to install without release', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.installOsUpdate();

      expect(consoleSpy).toHaveBeenCalledWith('[installOsUpdate] release not found');
      expect(mockInstall).not.toHaveBeenCalled();
    });

    it('should reboot server', () => {
      store.rebootServer();

      expect(mockDocumentSubmit).toHaveBeenCalled();
    });

    it('should view release notes using openChanges when available', () => {
      const openChangesSpy = vi.fn();
      vi.stubGlobal('openChanges', openChangesSpy);

      store.viewReleaseNotes('Test Release Notes');

      expect(openChangesSpy).toHaveBeenCalledWith(
        'showchanges /var/tmp/unRAIDServer.txt',
        'Test Release Notes'
      );
    });

    it('should view release notes using openBox when openChanges not available', () => {
      const openBoxSpy = vi.fn();
      vi.stubGlobal('openChanges', undefined);
      vi.stubGlobal('openBox', openBoxSpy);

      store.viewReleaseNotes('Test Release Notes');

      expect(openBoxSpy).toHaveBeenCalledWith(
        '/plugins/dynamix.plugin.manager/include/ShowChanges.php?file=/var/tmp/unRAIDServer.txt',
        'Test Release Notes',
        600,
        900
      );
    });

    it('should show alert when neither openChanges nor openBox are available', () => {
      vi.stubGlobal('openChanges', undefined);
      vi.stubGlobal('openBox', undefined);

      store.viewReleaseNotes('Test Release Notes');

      expect(mockAlert).toHaveBeenCalledWith('Unable to open release notes');
    });

    it('should set status', () => {
      store.setStatus('checking');
      expect(store.status).toBe('checking');

      store.setStatus('updating');
      expect(store.status).toBe('updating');
    });
  });

  describe('formattedReleaseDate', () => {
    it('should return empty string when no release date is available', () => {
      mockUpdateOsStore.availableWithRenewal = false;
      mockServerStore.updateOsResponse = null;
      store = useUpdateOsActionsStore();
      expect(store.formattedReleaseDate).toBe('');
    });

    it('should format date correctly with locale from server store', () => {
      mockUpdateOsStore.availableWithRenewal = true;
      mockServerStore.updateOsResponse = { date: '2023-10-15' };
      mockServerStore.locale = 'en_US';
      store = useUpdateOsActionsStore();

      const formatted = store.formattedReleaseDate;
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2023');
      expect(formatted).toContain('October');
      expect(formatted).toContain('15');
    });

    it('should normalize locale underscores to hyphens', () => {
      mockUpdateOsStore.availableWithRenewal = true;
      mockServerStore.updateOsResponse = { date: '2023-10-15' };
      mockServerStore.locale = 'fr_FR';
      store = useUpdateOsActionsStore();

      const formatted = store.formattedReleaseDate;
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should fall back to navigator.language when locale is missing', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });

      mockUpdateOsStore.availableWithRenewal = true;
      mockServerStore.updateOsResponse = { date: '2023-10-15' };
      mockServerStore.locale = undefined;
      store = useUpdateOsActionsStore();

      const formatted = store.formattedReleaseDate;
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');

      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });

    it('should fall back to en-US when locale and navigator.language are missing', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: undefined,
        configurable: true,
      });

      mockUpdateOsStore.availableWithRenewal = true;
      mockServerStore.updateOsResponse = { date: '2023-10-15' };
      mockServerStore.locale = undefined;
      store = useUpdateOsActionsStore();

      const formatted = store.formattedReleaseDate;
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2023');
      expect(formatted).toContain('October');
      expect(formatted).toContain('15');

      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });

    it('should parse date correctly to avoid off-by-one errors', () => {
      mockUpdateOsStore.availableWithRenewal = true;
      mockServerStore.updateOsResponse = { date: '2023-01-01' };
      mockServerStore.locale = 'en-US';
      store = useUpdateOsActionsStore();

      const formatted = store.formattedReleaseDate;
      expect(formatted).toContain('January');
      expect(formatted).toContain('1');
    });
  });

  describe('ineligibleText', () => {
    it('should return empty string when eligible', () => {
      mockServerStore.guid = 'test-guid';
      mockServerStore.keyfile = 'test-keyfile';
      mockServerStore.osVersion = '6.12.4';
      mockServerStore.regUpdatesExpired = false;
      store = useUpdateOsActionsStore();
      expect(store.ineligibleText).toBe('');
    });

    it('should stay eligible without a keyfile', () => {
      mockServerStore.guid = 'test-guid';
      mockServerStore.keyfile = '';
      mockServerStore.osVersion = '6.12.4';
      mockServerStore.regUpdatesExpired = false;
      store = useUpdateOsActionsStore();
      expect(store.ineligible).toBe(false);
      expect(store.ineligibleText).toBe('');
    });
  });
});
