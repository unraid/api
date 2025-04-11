/**
 * Errors store test coverage
 */

import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Error } from '~/store/errors';

import { useErrorsStore } from '~/store/errors';

const mockFeedbackButton = vi.fn();

// Mock OBJ_TO_STR function
vi.mock('~/helpers/functions', () => ({
  OBJ_TO_STR: (obj: unknown) => JSON.stringify(obj),
}));

// Mock FeedbackButton global
vi.stubGlobal('FeedbackButton', mockFeedbackButton);

describe('Errors Store', () => {
  let store: ReturnType<typeof useErrorsStore>;
  const originalConsoleError = console.error;

  const mockError: Error = {
    heading: 'Test Error',
    level: 'error',
    message: 'Test message',
    type: 'request',
    ref: 'test-ref',
  };

  beforeEach(() => {
    // Silence console.error during tests
    console.error = vi.fn();

    const pinia = createPinia();
    setActivePinia(pinia);
    store = useErrorsStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.resetAllMocks();
  });

  describe('State and Actions', () => {
    it('should initialize with empty errors array', () => {
      expect(store.errors).toEqual([]);
    });

    it('should add error', () => {
      store.setError(mockError);
      expect(store.errors).toHaveLength(1);
      expect(store.errors[0]).toEqual(mockError);
    });

    it('should remove error by index', async () => {
      store.setError(mockError);
      store.setError({ ...mockError, ref: 'test-ref-2' });
      expect(store.errors).toHaveLength(2);

      store.removeErrorByIndex(0);
      await nextTick();

      expect(store.errors).toHaveLength(1);
      expect(store.errors[0].ref).toBe('test-ref-2');
    });

    it('should remove error by ref', async () => {
      store.setError(mockError);
      store.setError({ ...mockError, ref: 'test-ref-2' });
      expect(store.errors).toHaveLength(2);

      store.removeErrorByRef('test-ref');
      await nextTick();

      expect(store.errors).toHaveLength(1);
      expect(store.errors[0].ref).toBe('test-ref-2');
    });

    it('should reset errors', async () => {
      store.setError(mockError);
      store.setError({ ...mockError, ref: 'test-ref-2' });
      expect(store.errors).toHaveLength(2);

      store.resetErrors();
      await nextTick();

      expect(store.errors).toHaveLength(0);
    });
  });

  describe('Troubleshoot Feature', () => {
    beforeEach(() => {
      // Mock the DOM elements needed for troubleshoot
      const mockModal = document.createElement('div');
      mockModal.className = 'sweet-alert visible';

      const mockTextarea = document.createElement('textarea');
      mockTextarea.id = 'troubleshootDetails';
      mockModal.appendChild(mockTextarea);

      const mockEmailInput = document.createElement('input');
      mockEmailInput.id = 'troubleshootEmail';
      mockModal.appendChild(mockEmailInput);

      const mockRadio = document.createElement('input');
      mockRadio.id = 'optTroubleshoot';
      mockRadio.type = 'radio';
      mockModal.appendChild(mockRadio);

      const mockPanels = document.createElement('div');
      mockPanels.className = 'allpanels';
      mockPanels.id = 'troubleshoot_panel';
      mockModal.appendChild(mockPanels);

      document.body.appendChild(mockModal);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should open troubleshoot with error details', async () => {
      store.setError(mockError);
      await nextTick();

      await store.openTroubleshoot({
        email: 'test@example.com',
        includeUnraidApiLogs: true,
      });

      const textarea = document.querySelector('#troubleshootDetails') as HTMLTextAreaElement;
      const emailInput = document.querySelector('#troubleshootEmail') as HTMLInputElement;
      const radio = document.querySelector('#optTroubleshoot') as HTMLInputElement;
      const panel = document.querySelector('#troubleshoot_panel') as HTMLElement;

      expect(mockFeedbackButton).toHaveBeenCalled();
      expect(textarea.value).toContain('Debug Details – Component Errors 1');
      expect(textarea.value).toContain('Error 1: Test Error');
      expect(textarea.value).toContain('Error 1 Message: Test message');
      expect(emailInput.value).toBe('test@example.com');
      expect(radio.checked).toBe(true);
      expect(panel.style.display).toBe('block');
    });
  });
});
