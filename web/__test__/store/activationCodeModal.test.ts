import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useCallbackActionsStore } from '~/store/callbackActions';

vi.mock('@vueuse/core', () => ({
  useSessionStorage: vi.fn(),
}));

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: vi.fn(),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(),
}));

describe('ActivationCodeModal Store', () => {
  let store: ReturnType<typeof useActivationCodeModalStore>;
  let mockIsHidden: ReturnType<typeof ref>;
  let mockIsFreshInstall: ReturnType<typeof ref>;
  let mockCallbackData: ReturnType<typeof ref>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location to prevent navigation errors
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    mockIsHidden = ref(null);
    mockIsFreshInstall = ref(false);
    mockCallbackData = ref(null);

    vi.mocked(useSessionStorage).mockReturnValue(mockIsHidden);
    vi.mocked(useActivationCodeDataStore).mockReturnValue({
      isFreshInstall: mockIsFreshInstall,
    } as unknown as ReturnType<typeof useActivationCodeDataStore>);
    vi.mocked(useCallbackActionsStore).mockReturnValue({
      callbackData: mockCallbackData,
    } as unknown as ReturnType<typeof useCallbackActionsStore>);

    setActivePinia(createPinia());
    store = useActivationCodeModalStore();
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockIsHidden.value = null;
    mockIsFreshInstall.value = false;
    mockCallbackData.value = null;
  });

  describe('State Management', () => {
    it('should initialize with correct storage key', () => {
      expect(useSessionStorage).toHaveBeenCalledWith(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, null);
    });

    it('should set isHidden value correctly', () => {
      store.setIsHidden(true);
      expect(mockIsHidden.value).toBe(true);

      store.setIsHidden(false);
      expect(mockIsHidden.value).toBe(false);

      store.setIsHidden(null);
      expect(mockIsHidden.value).toBe(null);
    });
  });

  describe('Computed Properties', () => {
    it('should be visible when explicitly set to show', () => {
      mockIsHidden.value = false;

      expect(store.isVisible).toBe(true);
    });

    it('should be visible when fresh install and not explicitly hidden', () => {
      mockIsHidden.value = null;
      mockIsFreshInstall.value = true;
      mockCallbackData.value = null;

      expect(store.isVisible).toBe(true);
    });

    it('should not be visible when explicitly hidden', () => {
      mockIsHidden.value = true;

      expect(store.isVisible).toBe(false);
    });

    it('should not be visible when not fresh install', () => {
      mockIsHidden.value = null;
      mockIsFreshInstall.value = false;

      expect(store.isVisible).toBe(false);
    });

    it('should not be visible when callback data exists', () => {
      mockIsHidden.value = null;
      mockIsFreshInstall.value = true;
      mockCallbackData.value = { someData: 'test' };

      expect(store.isVisible).toBe(false);
    });
  });

  describe('Konami Code Handling', () => {
    const keySequence = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];

    it('should not trigger on partial sequence', () => {
      keySequence.slice(0, 3).forEach((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });

      expect(mockIsHidden.value).toBe(null);
      expect(window.location.href).toBe('');
    });
  });
});
