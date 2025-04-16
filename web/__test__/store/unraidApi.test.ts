/**
 * UnraidApi store test coverage
 */

import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnraidApiStore } from '~/store/unraidApi';

vi.mock('~/helpers/create-apollo-client', () => ({
  client: {
    clearStore: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  },
}));

vi.mock('~/composables/services/webgui', () => ({
  WebguiUnraidApiCommand: vi.fn().mockResolvedValue(undefined),
}));

const mockErrorsStore = {
  setError: vi.fn(),
  removeErrorByRef: vi.fn(),
};

const mockServerStore = {
  connectPluginInstalled: true,
  stateDataError: false,
  csrf: 'mock-csrf-token',
};

describe('UnraidApi Store', () => {
  vi.mock('~/store/errors', () => ({
    useErrorsStore: () => mockErrorsStore,
  }));

  vi.mock('~/store/server', () => ({
    useServerStore: () => mockServerStore,
  }));

  let store: ReturnType<typeof useUnraidApiStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.assign(mockErrorsStore, {
      setError: vi.fn(),
      removeErrorByRef: vi.fn(),
    });

    Object.assign(mockServerStore, {
      connectPluginInstalled: true,
      stateDataError: false,
      csrf: 'mock-csrf-token',
    });

    setActivePinia(createPinia());

    store = useUnraidApiStore();

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with correct default values', () => {
      expect(store.unraidApiStatus).toBe('connecting');
      expect(store.prioritizeCorsError).toBe(false);
      expect(store.unraidApiClient).not.toBeNull();
    });
  });

  describe('Computed properties', () => {
    it('should have offlineError computed when status is offline', () => {
      expect(store.offlineError).toBeUndefined();

      store.unraidApiStatus = 'offline';
      expect(store.offlineError).toBeInstanceOf(Error);
      expect(store.offlineError?.message).toBe('The Unraid API is currently offline.');
    });

    it('should have unraidApiRestartAction when status is offline', () => {
      expect(store.unraidApiRestartAction).toBeUndefined();

      store.unraidApiStatus = 'offline';
      expect(store.unraidApiRestartAction).toBeDefined();
      expect(store.unraidApiRestartAction?.text).toBe('Restart unraid-api');
      expect(typeof store.unraidApiRestartAction?.click).toBe('function');
    });

    it('should not provide restart action when plugin not installed', () => {
      store.unraidApiStatus = 'offline';
      mockServerStore.connectPluginInstalled = false;

      store = useUnraidApiStore();

      expect(store.unraidApiRestartAction).toBeUndefined();
    });

    it('should not provide restart action when stateDataError exists', () => {
      store.unraidApiStatus = 'offline';
      mockServerStore.stateDataError = true;

      store = useUnraidApiStore();

      expect(store.unraidApiRestartAction).toBeUndefined();
    });

    it('should have restart action with click function when status is offline', () => {
      store.unraidApiStatus = 'offline';

      const action = store.unraidApiRestartAction;
      expect(action).toBeDefined();
      expect(action?.text).toBe('Restart unraid-api');
      expect(typeof action?.click).toBe('function');
    });
  });

  describe('Watchers', () => {
    it('should set error when status changes to offline', async () => {
      store.unraidApiStatus = 'offline';
      await nextTick();

      expect(mockErrorsStore.setError).toHaveBeenCalledWith({
        heading: 'Warning: API is offline!',
        message: 'The Unraid API is currently offline.',
        ref: 'unraidApiOffline',
        level: 'warning',
        type: 'unraidApiState',
      });
    });

    it('should remove error when status changes from offline', async () => {
      store.unraidApiStatus = 'offline';
      await nextTick();

      store.unraidApiStatus = 'online';
      await nextTick();

      expect(mockErrorsStore.removeErrorByRef).toHaveBeenCalledWith('unraidApiOffline');
    });
  });

  describe('Client actions', () => {
    it('should close client correctly', async () => {
      if (store.unraidApiClient) {
        const clearStoreSpy = vi.fn().mockResolvedValue(undefined);
        const stopSpy = vi.fn();

        const originalClearStore = store.unraidApiClient.clearStore;
        const originalStop = store.unraidApiClient.stop;

        store.unraidApiClient.clearStore = clearStoreSpy;
        store.unraidApiClient.stop = stopSpy;

        try {
          await store.closeUnraidApiClient();

          expect(clearStoreSpy).toHaveBeenCalledTimes(1);
          expect(stopSpy).toHaveBeenCalledTimes(1);
          expect(store.unraidApiClient).toBeNull();
          expect(store.unraidApiStatus).toBe('offline');
        } finally {
          if (store.unraidApiClient) {
            store.unraidApiClient.clearStore = originalClearStore;
            store.unraidApiClient.stop = originalStop;
          }
        }
      }
    });

    it('should handle null client during close', async () => {
      store.unraidApiClient = null;
      await store.closeUnraidApiClient();

      expect(store.unraidApiClient).toBeNull();
    });
  });

  describe('Restart actions', () => {
    it('should restart client when status is offline', async () => {
      const { WebguiUnraidApiCommand } = await import('~/composables/services/webgui');
      const mockWebguiCommand = vi.mocked(WebguiUnraidApiCommand);

      store.unraidApiStatus = 'offline';
      await store.restartUnraidApiClient();

      expect(mockWebguiCommand).toHaveBeenCalledWith({
        csrf_token: 'mock-csrf-token',
        command: 'start',
      });
      expect(store.unraidApiStatus).toBe('restarting');
    });

    it('should restart client when status is online', async () => {
      const { WebguiUnraidApiCommand } = await import('~/composables/services/webgui');
      const mockWebguiCommand = vi.mocked(WebguiUnraidApiCommand);

      store.unraidApiStatus = 'online';
      await store.restartUnraidApiClient();

      expect(mockWebguiCommand).toHaveBeenCalledWith({
        csrf_token: 'mock-csrf-token',
        command: 'restart',
      });
      expect(store.unraidApiStatus).toBe('restarting');
    });

    it('should handle error during restart', async () => {
      const { WebguiUnraidApiCommand } = await import('~/composables/services/webgui');
      const mockWebguiCommand = vi.mocked(WebguiUnraidApiCommand);

      mockWebguiCommand.mockRejectedValueOnce(new Error('API restart failed'));

      store.unraidApiStatus = 'online';
      await store.restartUnraidApiClient();

      expect(mockWebguiCommand).toHaveBeenCalled();
      expect(mockErrorsStore.setError).toHaveBeenCalledWith({
        heading: 'Error: unraid-api restart',
        message: 'API restart failed',
        level: 'error',
        ref: 'restartUnraidApiClient',
        type: 'request',
      });
    });

    it('should handle string error during restart', async () => {
      const { WebguiUnraidApiCommand } = await import('~/composables/services/webgui');
      const mockWebguiCommand = vi.mocked(WebguiUnraidApiCommand);

      mockWebguiCommand.mockRejectedValueOnce('string error');

      store.unraidApiStatus = 'online';
      await store.restartUnraidApiClient();

      expect(mockWebguiCommand).toHaveBeenCalled();
      expect(mockErrorsStore.setError).toHaveBeenCalledWith({
        heading: 'Error: unraid-api restart',
        message: 'STRING ERROR',
        level: 'error',
        ref: 'restartUnraidApiClient',
        type: 'request',
      });
    });

    it('should handle unknown error during restart', async () => {
      const { WebguiUnraidApiCommand } = await import('~/composables/services/webgui');
      const mockWebguiCommand = vi.mocked(WebguiUnraidApiCommand);

      mockWebguiCommand.mockRejectedValueOnce(null);

      store.unraidApiStatus = 'online';
      await store.restartUnraidApiClient();

      expect(mockWebguiCommand).toHaveBeenCalled();
      expect(mockErrorsStore.setError).toHaveBeenCalledWith({
        heading: 'Error: unraid-api restart',
        message: 'Unknown error',
        level: 'error',
        ref: 'restartUnraidApiClient',
        type: 'request',
      });
    });
  });
});
