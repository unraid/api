/**
 * Modal store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useModalStore } from '~/store/modal';

// Mock useToggle from @vueuse/core
vi.mock('@vueuse/core', () => ({
  useToggle: vi.fn((value) => () => {
    value.value = !value.value;
  }),
}));

describe('Modal Store', () => {
  let store: ReturnType<typeof useModalStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useModalStore();
    vi.clearAllMocks();
  });

  describe('State and Initialization', () => {
    it('should initialize with modal visible', () => {
      expect(store.modalVisible).toBe(true);
    });
  });

  describe('Actions', () => {
    it('should hide modal', () => {
      store.modalHide();
      expect(store.modalVisible).toBe(false);
    });

    it('should show modal', () => {
      // First set to false to test the show functionality
      store.modalHide();
      expect(store.modalVisible).toBe(false);

      store.modalShow();
      expect(store.modalVisible).toBe(true);
    });

    it('should toggle modal visibility', () => {
      // Initially true
      expect(store.modalVisible).toBe(true);

      // First toggle - should become false
      store.modalToggle();
      expect(store.modalVisible).toBe(false);

      // Second toggle - should become true again
      store.modalToggle();
      expect(store.modalVisible).toBe(true);
    });
  });
});
