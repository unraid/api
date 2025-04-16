/**
 * Callback actions store test coverage
 */

import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalSignIn, ExternalUpdateOsAction, QueryPayloads } from '@unraid/shared-callbacks';
import type { Mock } from 'vitest';

import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

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

// Mock modules using factory functions to avoid hoisting issues
vi.mock('@unraid/shared-callbacks', () => {
  const mockWatcher = vi.fn();
  const mockSend = vi.fn();

  return {
    useCallback: vi.fn(({ encryptionKey: _encryptionKey }) => ({
      send: mockSend,
      watcher: mockWatcher,
      parse: vi.fn(),
    })),
  };
});

vi.mock('~/composables/preventClose', () => {
  const addPreventClose = vi.fn();
  const removePreventClose = vi.fn();

  return {
    addPreventClose,
    removePreventClose,
  };
});

vi.mock('~/store/account', () => {
  const setAccountAction = vi.fn();
  const setConnectSignInPayload = vi.fn();
  const setQueueConnectSignOut = vi.fn();

  return {
    useAccountStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      setAccountAction,
      setConnectSignInPayload,
      setQueueConnectSignOut,
      accountActionStatus: ref('success'),
    })),
  };
});

vi.mock('~/store/installKey', () => {
  const install = vi.fn();

  return {
    useInstallKeyStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      install,
      keyInstallStatus: ref('success'),
    })),
  };
});

vi.mock('~/store/server', () => {
  const refreshServerState = vi.fn();

  return {
    useServerStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      refreshServerState,
      refreshServerStateStatus: ref('done'),
    })),
  };
});

vi.mock('~/store/updateOsActions', () => {
  const setUpdateOsAction = vi.fn();
  const actOnUpdateOsAction = vi.fn();

  return {
    useUpdateOsActionsStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      setUpdateOsAction,
      actOnUpdateOsAction,
    })),
  };
});

vi.mock('~/store/updateOs', () => {
  return {
    useUpdateOsStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
    })),
  };
});

describe('Callback Actions Store', () => {
  let store: ReturnType<typeof useCallbackActionsStore>;
  let preventClose: { addPreventClose: Mock; removePreventClose: Mock };
  let mockWatcher: Mock;

  beforeEach(async () => {
    setActivePinia(createPinia());
    store = useCallbackActionsStore();

    const preventCloseModule = await import('~/composables/preventClose');

    preventClose = {
      addPreventClose: vi.mocked(preventCloseModule.addPreventClose),
      removePreventClose: vi.mocked(preventCloseModule.removePreventClose),
    };

    const { useCallback } = await import('@unraid/shared-callbacks');

    mockWatcher = vi.mocked(useCallback).mock.results[0].value.watcher;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      expect(store.callbackStatus).toBe('ready');
      expect(store.callbackData).toBeUndefined();
      expect(store.sendType).toBe('fromUpc');
      expect(store.encryptionKey).toBe(import.meta.env.VITE_CALLBACK_KEY);
    });
  });

  describe('Watcher Functionality', () => {
    it('should call saveCallbackData when watcher returns data', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
        ],
        sender: 'test',
      };

      mockWatcher.mockReturnValue(mockData);
      store.watcher();

      expect(mockWatcher).toHaveBeenCalled();
      expect(store.callbackData).toEqual(mockData);
      expect(store.callbackStatus).toBe('loading');
    });

    it('should not call saveCallbackData when watcher returns null', async () => {
      mockWatcher.mockReturnValue(null);
      store.watcher();

      expect(mockWatcher).toHaveBeenCalled();
      expect(store.callbackData).toBeUndefined();
      expect(store.callbackStatus).toBe('ready');
    });
  });

  describe('Save Callback Data', () => {
    it('should save data and trigger redirect when valid data provided', () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);

      expect(store.callbackData).toEqual(mockData);
      expect(store.callbackStatus).toBe('loading');
    });

    it('should handle missing callback data', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      store.saveCallbackData(undefined);

      expect(consoleSpy).toHaveBeenCalledWith('Saved callback data not found');
      expect(store.callbackStatus).toBe('ready');
    });

    it('should handle invalid callback type', async () => {
      const mockData = {
        type: 'fromUpc',
        actions: [],
        sender: 'test',
      } as QueryPayloads;
      const consoleSpy = vi.spyOn(console, 'error');

      store.saveCallbackData(mockData);
      await nextTick();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[redirectToCallbackType]',
        'Callback redirect type not present or incorrect'
      );
      expect(store.callbackStatus).toBe('ready');
      expect(store.$state.callbackError).toBe('Callback redirect type not present or incorrect');
    });
  });

  describe('Callback Actions Handling', () => {
    it('should handle sign in action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);
      await nextTick();

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setConnectSignInPayload).toHaveBeenCalledWith({
        apiKey: 'test-key',
        email: 'test@example.com',
        preferred_username: 'test',
      });
      expect(vi.mocked(useServerStore)().refreshServerState).toHaveBeenCalled();
    });

    it('should handle sign out action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signOut',
          },
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);
      await nextTick();

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setQueueConnectSignOut).toHaveBeenCalledWith(true);
      expect(vi.mocked(useServerStore)().refreshServerState).toHaveBeenCalled();
    });

    it('should handle oemSignOut action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'oemSignOut',
          },
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);
      await nextTick();

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setQueueConnectSignOut).toHaveBeenCalledWith(true);
      expect(vi.mocked(useServerStore)().refreshServerState).toHaveBeenCalled();
    });

    it('should handle updateOs action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'updateOs',
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            sha256: 'test-sha256',
            version: '6.12.3',
          } as ExternalUpdateOsAction,
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);
      await nextTick();

      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().actOnUpdateOsAction).toHaveBeenCalled();
      expect(vi.mocked(useServerStore)().refreshServerState).not.toHaveBeenCalled(); // Single action, no refresh needed
    });

    it('should handle downgradeOs action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'downgradeOs',
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            sha256: 'test-sha256',
            version: '6.11.5',
          } as ExternalUpdateOsAction,
        ],
        sender: 'test',
      };
      const mockUpdateOsActionsStore = useUpdateOsActionsStore();

      store.saveCallbackData(mockData);
      await nextTick();

      expect(mockUpdateOsActionsStore.setUpdateOsAction).toHaveBeenCalled();
      expect(mockUpdateOsActionsStore.actOnUpdateOsAction).toHaveBeenCalledWith(true);
      expect(vi.mocked(useServerStore)().refreshServerState).not.toHaveBeenCalled(); // Single action, no refresh needed
    });

    it('should handle multiple actions', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
          {
            type: 'updateOs',
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            sha256: 'test-sha256',
            version: '6.12.3',
          } as ExternalUpdateOsAction,
        ],
        sender: 'test',
      };

      store.saveCallbackData(mockData);
      await nextTick();

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).toHaveBeenCalled();
      expect(vi.mocked(useServerStore)().refreshServerState).toHaveBeenCalled();
    });

    it('should handle key install action (e.g., purchase)', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'purchase',
            keyUrl: 'mock-key-url',
          },
        ],
        sender: 'test',
      };
      const mockInstallKeyStore = useInstallKeyStore();

      store.saveCallbackData(mockData);
      await nextTick();

      expect(mockInstallKeyStore.install).toHaveBeenCalledWith(mockData.actions[0]);
      expect(vi.mocked(useAccountStore)().setAccountAction).not.toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).not.toHaveBeenCalled();
      expect(vi.mocked(useServerStore)().refreshServerState).toHaveBeenCalled();
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      // Mock window.history
      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
      vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        pathname: '/test-path',
      });
    });

    it('should handle status changes correctly', async () => {
      store.setCallbackStatus('loading');
      await nextTick();

      expect(preventClose.addPreventClose).toHaveBeenCalled();

      store.setCallbackStatus('success');
      await nextTick();

      expect(preventClose.removePreventClose).toHaveBeenCalled();
      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/test-path');
    });

    it('should handle multiple status transitions', async () => {
      store.setCallbackStatus('loading');
      await nextTick();

      expect(preventClose.addPreventClose).toHaveBeenCalledTimes(1);

      store.setCallbackStatus('error');
      await nextTick();

      expect(preventClose.removePreventClose).toHaveBeenCalledTimes(1);
      expect(window.history.replaceState).toHaveBeenCalledTimes(1);

      store.setCallbackStatus('loading');
      await nextTick();

      expect(preventClose.addPreventClose).toHaveBeenCalledTimes(2);

      store.setCallbackStatus('success');
      await nextTick();

      expect(preventClose.removePreventClose).toHaveBeenCalledTimes(2);
      expect(window.history.replaceState).toHaveBeenCalledTimes(2);
    });

    it('should not trigger prevent close for non-loading status changes', () => {
      store.setCallbackStatus('ready');
      expect(preventClose.addPreventClose).not.toHaveBeenCalled();
      expect(preventClose.removePreventClose).not.toHaveBeenCalled();

      store.setCallbackStatus('error');
      expect(preventClose.addPreventClose).not.toHaveBeenCalled();
      expect(preventClose.removePreventClose).not.toHaveBeenCalled();
    });
  });
});
