/**
 * Modal store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useModalStore } from '~/store/modal';

vi.mock('@vueuse/core', () => ({
  useToggle: (initial: boolean) => {
    const state = ref(initial)
    const toggle = () => { state.value = !state.value }
    return [state, toggle]
  }
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
      store.modalHide();
      expect(store.modalVisible).toBe(false);

      store.modalShow();
      expect(store.modalVisible).toBe(true);
    });

    it('should toggle modal visibility', () => {
      expect(store.modalVisible).toBe(true);

      store.modalToggle();
      expect(store.modalVisible).toBe(false);

      store.modalToggle();
      expect(store.modalVisible).toBe(true);
    });
  });
});
