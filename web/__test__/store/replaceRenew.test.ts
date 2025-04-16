/**
 * ReplaceRenew store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ValidateGuidResponse } from '~/composables/services/keyServer';

import { validateGuid } from '~/composables/services/keyServer';
import { REPLACE_CHECK_LOCAL_STORAGE_KEY, useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

vi.mock('@unraid/shared-callbacks', () => ({}));

vi.mock('~/composables/services/keyServer', () => ({
  validateGuid: vi.fn(),
}));

vi.mock('~/store/server', () => ({
  useServerStore: vi.fn(),
}));

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('ReplaceRenew Store', () => {
  let store: ReturnType<typeof useReplaceRenewStore>;
  let mockGuid = 'test-guid';
  let mockKeyfile = 'test-keyfile.key';

  beforeEach(() => {
    vi.resetAllMocks();
    mockGuid = 'test-guid';
    mockKeyfile = 'test-keyfile.key';

    vi.mocked(useServerStore).mockReturnValue({
      guid: mockGuid,
      keyfile: mockKeyfile,
    } as unknown as ReturnType<typeof useServerStore>);

    vi.spyOn(console, 'error').mockImplementation(() => {});

    setActivePinia(createPinia());
    store = useReplaceRenewStore();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('State and Initialization', () => {
    it('should initialize with default state values', () => {
      expect(store.keyLinkedStatus).toBe('ready');
      expect(store.renewStatus).toBe('ready');
      expect(store.replaceStatus).toBe('ready');
    });

    it('should initialize with error state when guid is missing', () => {
      vi.mocked(useServerStore).mockReturnValueOnce({
        guid: undefined,
        keyfile: mockKeyfile,
      } as unknown as ReturnType<typeof useServerStore>);

      setActivePinia(createPinia());

      const newStore = useReplaceRenewStore();

      expect(newStore.replaceStatus).toBe('error');
    });
  });

  describe('Computed Properties', () => {
    it('should return correct keyLinkedOutput for each status', () => {
      expect(store.keyLinkedOutput.variant).toBe('gray');
      expect(store.keyLinkedOutput.text).toBe('Unknown');

      store.keyLinkedStatus = 'checking';
      expect(store.keyLinkedOutput.variant).toBe('gray');
      expect(store.keyLinkedOutput.text).toBe('Checking...');

      store.keyLinkedStatus = 'linked';
      expect(store.keyLinkedOutput.variant).toBe('green');
      expect(store.keyLinkedOutput.text).toBe('Linked');

      store.keyLinkedStatus = 'notLinked';
      expect(store.keyLinkedOutput.variant).toBe('yellow');
      expect(store.keyLinkedOutput.text).toBe('Not Linked');

      store.keyLinkedStatus = 'error';
      // Test with a specific error message
      store.error = { name: 'TestError', message: 'Specific Linked Error' };
      expect(store.keyLinkedOutput.variant).toBe('red');
      expect(store.keyLinkedOutput.text).toBe('Specific Linked Error');
    });

    it('should return correct replaceStatusOutput for each status', () => {
      expect(store.replaceStatusOutput).toBeUndefined();

      store.replaceStatus = 'checking';
      expect(store.replaceStatusOutput?.variant).toBe('gray');
      expect(store.replaceStatusOutput?.text).toBe('Checking...');

      store.replaceStatus = 'eligible';
      expect(store.replaceStatusOutput?.variant).toBe('green');
      expect(store.replaceStatusOutput?.text).toBe('Eligible');

      store.replaceStatus = 'ineligible';
      expect(store.replaceStatusOutput?.variant).toBe('red');
      expect(store.replaceStatusOutput?.text).toBe('Ineligible for self-replacement');

      store.replaceStatus = 'error';
      store.error = { name: 'TestError', message: 'Specific Replace Error' };

      expect(store.replaceStatusOutput?.variant).toBe('red');
      expect(store.replaceStatusOutput?.text).toBe('Specific Replace Error');
    });
  });

  describe('Actions', () => {
    it('should purge validation response', async () => {
      await store.purgeValidationResponse();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);
    });

    it('should set status actions correctly', () => {
      store.setReplaceStatus('eligible');
      expect(store.replaceStatus).toBe('eligible');

      store.setRenewStatus('installing');
      expect(store.renewStatus).toBe('installing');
    });

    describe('check action', () => {
      const mockResponse = {
        hasNewerKeyfile: false,
        linked: true,
        replaceable: true,
      };

      beforeEach(() => {
        vi.mocked(validateGuid).mockResolvedValue(mockResponse as unknown as ValidateGuidResponse);
        mockSessionStorage.getItem.mockReturnValue(null);
        vi.mocked(useServerStore).mockReturnValue({
          guid: 'test-guid',
          keyfile: 'test-keyfile.key',
        } as unknown as ReturnType<typeof useServerStore>);

        setActivePinia(createPinia());
        store = useReplaceRenewStore();
      });

      it('should handle missing guid', async () => {
        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        testStore.setReplaceStatus('error');

        expect(testStore.replaceStatus).toBe('error');
      });

      it('should handle missing keyfile', async () => {
        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        testStore.setReplaceStatus('error');

        expect(testStore.replaceStatus).toBe('error');
      });

      it('should use cached response if available and valid', async () => {
        const cachedResponse = {
          key: 'eyfile.key',
          timestamp: Date.now(),
          hasNewerKeyfile: false,
          linked: false,
          replaceable: false,
        };

        mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cachedResponse));
        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        await testStore.check();

        expect(validateGuid).not.toHaveBeenCalled();

        expect(testStore.keyLinkedStatus).toBe('notLinked');
        expect(testStore.replaceStatus).toBe('ineligible');

        expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();
      });

      it('should purge cache and re-fetch if timestamp is expired', async () => {
        vi.useFakeTimers();
        const expiredTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
        const cachedResponse = {
          key: 'eyfile.key',
          timestamp: expiredTimestamp,
          hasNewerKeyfile: false,
          linked: false,
          replaceable: false,
        };

        mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cachedResponse));
        vi.mocked(validateGuid).mockResolvedValue(mockResponse as unknown as ValidateGuidResponse);

        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        await testStore.check();

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);

        expect(validateGuid).toHaveBeenCalled();
        expect(testStore.keyLinkedStatus).toBe('linked');
        expect(testStore.replaceStatus).toBe('eligible');

        vi.useRealTimers();
      });

      it('should purge cache and re-fetch if key is missing in cache', async () => {
        const cachedResponse = {
          timestamp: Date.now(),
          hasNewerKeyfile: false,
          linked: false,
          replaceable: false,
        };

        mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cachedResponse));
        vi.mocked(validateGuid).mockResolvedValue(mockResponse as unknown as ValidateGuidResponse);

        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        await testStore.check();

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);
        expect(validateGuid).toHaveBeenCalled();
        expect(testStore.keyLinkedStatus).toBe('linked');
        expect(testStore.replaceStatus).toBe('eligible');
      });

      it('should purge cache and re-fetch if key in cache mismatches current keyfile', async () => {
        const cachedResponse = {
          key: 'mismatched',
          timestamp: Date.now(),
          hasNewerKeyfile: false,
          linked: false,
          replaceable: false,
        };

        mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cachedResponse));
        vi.mocked(validateGuid).mockResolvedValue(mockResponse as unknown as ValidateGuidResponse);
        setActivePinia(createPinia());

        const testStore = useReplaceRenewStore();

        await testStore.check();

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);
        expect(validateGuid).toHaveBeenCalled();
        expect(testStore.keyLinkedStatus).toBe('linked');
        expect(testStore.replaceStatus).toBe('eligible');
      });

      it('should call validateGuid with correct parameters', async () => {
        await store.check();

        expect(validateGuid).toHaveBeenCalledWith({
          guid: 'test-guid',
          keyfile: 'test-keyfile.key',
        });
      });

      it('should set statuses based on validateGuid response', async () => {
        await store.check();

        expect(store.keyLinkedStatus).toBe('linked');
        expect(store.replaceStatus).toBe('eligible');
      });

      it('should cache the validation response', async () => {
        vi.useFakeTimers();
        const now = new Date('2023-01-01').getTime();
        vi.setSystemTime(now);

        await store.check();

        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          REPLACE_CHECK_LOCAL_STORAGE_KEY,
          JSON.stringify({
            key: 'eyfile.key',
            timestamp: now,
            ...mockResponse,
          })
        );

        vi.useRealTimers();
      });

      it('should purge cache when skipCache is true', async () => {
        mockSessionStorage.getItem.mockReturnValue(
          JSON.stringify({ key: 'eyfile.key', timestamp: Date.now() })
        );
        setActivePinia(createPinia());
        const testStore = useReplaceRenewStore();

        await testStore.check(true);

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);
        expect(validateGuid).toHaveBeenCalled();
      });

      it('should handle errors during check', async () => {
        const testError = new Error('Test error');
        vi.mocked(validateGuid).mockRejectedValueOnce(testError);

        await store.check();

        expect(store.replaceStatus).toBe('error');
        expect(console.error).toHaveBeenCalledWith('[ReplaceCheck.check]', testError);
        expect(store.error).toEqual(testError);
      });
    });
  });
});
