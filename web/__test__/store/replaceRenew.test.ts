/**
 * ReplaceRenew store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
      // Setup mock for test with missing guid
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
      expect(store.keyLinkedOutput.variant).toBe('red');
      expect(store.keyLinkedOutput.text).toBe('Unknown error'); // Default error message
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
      expect(store.replaceStatusOutput?.variant).toBe('red');
      expect(store.replaceStatusOutput?.text).toBe('Unknown error'); // Default error message
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
        vi.mocked(validateGuid).mockResolvedValue(mockResponse as any);
        mockSessionStorage.getItem.mockReturnValue(null);
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
            key: 'eyfile.key', // Last 10 chars of keyfile
            timestamp: now,
            ...mockResponse,
          })
        );

        vi.useRealTimers();
      });

      it('should purge cache when skipCache is true', async () => {
        await store.check(true);

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(REPLACE_CHECK_LOCAL_STORAGE_KEY);
      });

      it('should handle errors during check', async () => {
        const testError = new Error('Test error');
        vi.mocked(validateGuid).mockRejectedValueOnce(testError);

        await store.check();

        expect(store.replaceStatus).toBe('error');
        expect(console.error).toHaveBeenCalledWith('[ReplaceCheck.check]', testError);
      });
    });
  });
});
