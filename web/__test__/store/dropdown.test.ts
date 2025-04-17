/**
 * Dropdown store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import { useDropdownStore } from '~/store/dropdown';

describe('Dropdown Store', () => {
  let store: ReturnType<typeof useDropdownStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDropdownStore();
  });

  describe('State and Actions', () => {
    it('should initialize with dropdown hidden', () => {
      expect(store.dropdownVisible).toBe(false);
    });

    it('should show dropdown', () => {
      store.dropdownShow();
      expect(store.dropdownVisible).toBe(true);
    });

    it('should hide dropdown', () => {
      store.dropdownShow();
      store.dropdownHide();
      expect(store.dropdownVisible).toBe(false);
    });

    it('should toggle dropdown', () => {
      expect(store.dropdownVisible).toBe(false);
      store.dropdownToggle();
      expect(store.dropdownVisible).toBe(true);
      store.dropdownToggle();
      expect(store.dropdownVisible).toBe(false);
    });
  });
});
