/**
 * Errors store test coverage
 */

import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Error } from '~/store/errors';

import { useErrorsStore } from '~/store/errors';

const mockFeedbackButton = vi.fn();

vi.mock('~/helpers/functions', () => ({
  OBJ_TO_STR: (obj: unknown) => JSON.stringify(obj),
}));

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

    it('should not change errors when removing by non-existent index', async () => {
      store.setError(mockError);
      const initialErrors = [...store.errors];
      expect(initialErrors).toHaveLength(1);

      store.removeErrorByIndex(99);
      await nextTick();

      expect(store.errors).toHaveLength(1);
      expect(store.errors).toEqual(initialErrors);
    });

    it('should not change errors when removing by non-existent ref', async () => {
      store.setError(mockError);
      const initialErrors = [...store.errors];
      expect(initialErrors).toHaveLength(1);

      store.removeErrorByRef('non-existent-ref');
      await nextTick();

      expect(store.errors).toHaveLength(1);
      expect(store.errors).toEqual(initialErrors);
    });
  });

  describe('Troubleshoot Feature', () => {
    beforeEach(() => {
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

    it('should open troubleshoot with multiple error details including debugServer', async () => {
      const error1: Error = { ...mockError, ref: 'err1' };
      const error2: Error = {
        heading: 'Second Error',
        level: 'warning',
        message: 'Another message',
        type: 'serverState',
        ref: 'err2',
        debugServer: { guid: 'debug-guid', name: 'debug-server' },
      };
      store.setError(error1);
      store.setError(error2);
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
      expect(textarea.value).toContain('Debug Details – Component Errors 2');
      expect(textarea.value).toContain('Error 1: Test Error');
      expect(textarea.value).toContain('Error 1 Message: Test message');
      expect(textarea.value).toContain('Error 1 Ref: err1');
      expect(textarea.value).not.toContain('Error 1 Debug Server');
      expect(textarea.value).toContain('\n***************\n');
      expect(textarea.value).toContain('Error 2: Second Error');
      expect(textarea.value).toContain('Error 2 Message: Another message');
      expect(textarea.value).toContain('Error 2 Level: warning');
      expect(textarea.value).toContain('Error 2 Type: serverState');
      expect(textarea.value).toContain('Error 2 Ref: err2');
      expect(textarea.value).toContain(
        'Error 2 Debug Server:\n{"guid":"debug-guid","name":"debug-server"}'
      );

      expect(emailInput.value).toBe('test@example.com');
      expect(radio.checked).toBe(true);
      expect(panel.style.display).toBe('block');
    });

    it('should focus email input if no email provided', async () => {
      const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');

      await store.openTroubleshoot({
        email: '',
        includeUnraidApiLogs: true,
      });

      const emailInput = document.querySelector('#troubleshootEmail') as HTMLInputElement;

      expect(focusSpy).toHaveBeenCalled();
      expect(emailInput.value).toBe('');

      focusSpy.mockRestore();
    });

    it('should handle errors during troubleshoot opening', async () => {
      const testError = new Error('FeedbackButton failed');
      mockFeedbackButton.mockRejectedValueOnce(testError);

      const consoleSpy = vi.spyOn(console, 'error');

      await store.openTroubleshoot({
        email: 'test@example.com',
        includeUnraidApiLogs: true,
      });

      expect(mockFeedbackButton).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[openTroubleshoot]', testError);

      consoleSpy.mockRestore();
    });
  });
});
