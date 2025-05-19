import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useCallbackActionsStore } from '~/store/callbackActions';

// Mock declarations must be at top level due to hoisting
vi.mock('@vueuse/core', () => ({
  useSessionStorage: vi.fn(),
}));

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: vi.fn(),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(),
}));

// Add a variable to track the handler
let konamiHandler: ((event: KeyboardEvent) => void) | null = null;

// Update the Vue mock to store the handler
vi.mock('vue', () => {
  const actual = require('vue');
  return {
    ...actual,
    onMounted: (fn: unknown) => {
      const handler = fn as (event: KeyboardEvent) => void;
      konamiHandler = handler;
      handler(undefined as any); // Execute the callback immediately with undefined
    },
    onUnmounted: () => {},
  };
});

// Declare sequenceIndex at the top of the test file
let sequenceIndex = 0;

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

    // Setup mock refs
    mockIsHidden = ref(null);
    mockIsFreshInstall = ref(false);
    mockCallbackData = ref(null);

    // Setup store mocks
    vi.mocked(useSessionStorage).mockReturnValue(mockIsHidden);
    vi.mocked(useActivationCodeDataStore).mockReturnValue({
      isFreshInstall: mockIsFreshInstall,
    } as unknown as ReturnType<typeof useActivationCodeDataStore>);
    vi.mocked(useCallbackActionsStore).mockReturnValue({
      callbackData: mockCallbackData,
    } as unknown as ReturnType<typeof useCallbackActionsStore>);

    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    store = useActivationCodeModalStore();
  });

  afterEach(() => {
    if (konamiHandler) {
      window.removeEventListener('keydown', konamiHandler);
      konamiHandler = null;
    }
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

    it('should handle correct konami code sequence', () => {
      // Simulate key presses
      keySequence.forEach((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });

      expect(mockIsHidden.value).toBe(true);
      expect(window.location.href).toBe('/Tools/Registration');
    });

    it('should not trigger on partial sequence', () => {
      // Press only first few keys
      keySequence.slice(0, 3).forEach((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });

      expect(mockIsHidden.value).toBe(null);
      expect(window.location.href).toBe('');
    });
  });
});
