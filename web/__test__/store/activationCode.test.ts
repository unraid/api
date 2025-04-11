/**
 * Activation code store test coverage
 */

import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActivationCodeStore } from '~/store/activationCode';

// Mock console methods to suppress output
const originalConsoleDebug = console.debug;
const originalConsoleError = console.error;

beforeAll(() => {
  console.debug = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.debug = originalConsoleDebug;
  console.error = originalConsoleError;
});

// Mock sessionStorage
const mockStorage = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
});

// Mock dependencies
vi.mock('pinia', async () => {
  const mod = await vi.importActual<typeof import('pinia')>('pinia');

  return {
    ...mod,
    storeToRefs: () => ({
      state: ref('ENOKEYFILE'),
      callbackData: ref(null),
    }),
  };
});

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    state: 'ENOKEYFILE',
  }),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    callbackData: null,
  }),
}));

describe('Activation Code Store', () => {
  let store: ReturnType<typeof useActivationCodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());

    store = useActivationCodeStore();
    vi.clearAllMocks();
    mockStorage.clear();
  });

  describe('State and Actions', () => {
    const mockData = {
      code: 'TEST123',
      partnerName: 'Test Partner',
      partnerUrl: 'https://test.com',
      partnerLogo: true,
    };

    it('should initialize with null data', () => {
      expect(store.code).toBeNull();
      expect(store.partnerName).toBeNull();
      expect(store.partnerUrl).toBeNull();
      expect(store.partnerLogo).toBeNull();
    });

    it('should set data correctly', () => {
      store.setData(mockData);

      expect(store.code).toBe('TEST123');
      expect(store.partnerName).toBe('Test Partner');
      expect(store.partnerUrl).toBe('https://test.com');
      expect(store.partnerLogo).toBe('/webGui/images/partner-logo.svg');
    });

    it('should handle data without optional fields', () => {
      store.setData({ code: 'TEST123' });

      expect(store.code).toBe('TEST123');
      expect(store.partnerName).toBeNull();
      expect(store.partnerUrl).toBeNull();
      expect(store.partnerLogo).toBeNull();
    });
  });

  describe('Modal Visibility', () => {
    it('should show activation modal by default when conditions are met', () => {
      store.setData({ code: 'TEST123' });

      expect(store.showActivationModal).toBe(true);
    });

    it('should not show modal when data is null', () => {
      expect(store.showActivationModal).toBe(false);
    });

    it('should handle modal visibility state in session storage', async () => {
      store.setData({ code: 'TEST123' });
      expect(store.showActivationModal).toBe(true);

      store.setActivationModalHidden(true);
      await nextTick();

      expect(store.showActivationModal).toBe(false);
      expect(sessionStorage.getItem(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY)).toBe('true');

      store.setActivationModalHidden(false);
      await nextTick();

      expect(store.showActivationModal).toBe(true);
      expect(sessionStorage.getItem(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
    });
  });
});
