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
import { keyActionRefreshDelayMs } from '~/store/callbackActions.helpers';
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
const mockAccountActionStatus = ref('success');
const mockKeyInstallStatus = ref('success');
const mockRefreshServerStateStatus = ref<'done' | 'ready' | 'refreshing' | 'timeout'>('done');
const mockInstall = vi.fn();
const mockRefreshServerState = vi.fn();

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
      get accountActionStatus() {
        return mockAccountActionStatus.value;
      },
    })),
  };
});

vi.mock('~/store/installKey', () => {
  return {
    useInstallKeyStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      install: mockInstall,
      get keyInstallStatus() {
        return mockKeyInstallStatus.value;
      },
    })),
  };
});

vi.mock('~/store/server', () => {
  return {
    useServerStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn(),
      $dispose: vi.fn(),
      refreshServerState: mockRefreshServerState,
      get refreshServerStateStatus() {
        return mockRefreshServerStateStatus.value;
      },
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
    mockAccountActionStatus.value = 'success';
    mockKeyInstallStatus.value = 'success';
    mockRefreshServerStateStatus.value = 'done';
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
      expect(store.callbackCallsCompleted).toBe(true);
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
    it('waits for earlier async actions to finish before refreshing mixed callbacks', async () => {
      let resolveInstall: (() => void) | undefined;
      const installPromise = new Promise<void>((resolve) => {
        resolveInstall = resolve;
      });
      mockInstall.mockReturnValueOnce(installPromise);

      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'purchase',
            keyUrl: 'mock-key-url',
          },
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
        ],
        sender: 'test',
      };

      const savePromise = store.saveCallbackData(mockData);
      await nextTick();

      expect(mockRefreshServerState).not.toHaveBeenCalled();
      expect(store.callbackCallsCompleted).toBe(false);

      resolveInstall?.();
      await savePromise;

      expect(mockRefreshServerState).toHaveBeenCalledTimes(1);
      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
    });

    it('should handle sign in action', async () => {
      mockAccountActionStatus.value = 'waiting';
      mockRefreshServerStateStatus.value = 'refreshing';

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

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setConnectSignInPayload).toHaveBeenCalledWith({
        apiKey: 'test-key',
        email: 'test@example.com',
        preferred_username: 'test',
      });
      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('loading');

      mockAccountActionStatus.value = 'success';
      await nextTick();

      expect(store.callbackStatus).toBe('success');
    });

    it('should handle sign in action with missing optional callback fields', async () => {
      mockAccountActionStatus.value = 'waiting';
      mockRefreshServerStateStatus.value = 'refreshing';

      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signIn',
            apiKey: undefined,
            user: { email: undefined, preferred_username: undefined },
          } as unknown as ExternalSignIn,
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setConnectSignInPayload).toHaveBeenCalledWith({
        apiKey: '',
        email: '',
        preferred_username: '',
      });
      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('loading');
    });

    it('should handle sign out action', async () => {
      mockAccountActionStatus.value = 'waiting';
      mockRefreshServerStateStatus.value = 'refreshing';

      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'signOut',
          },
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setQueueConnectSignOut).toHaveBeenCalledWith(true);
      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('loading');
    });

    it('should handle oemSignOut action', async () => {
      mockAccountActionStatus.value = 'waiting';
      mockRefreshServerStateStatus.value = 'refreshing';

      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'oemSignOut',
          },
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useAccountStore)().setQueueConnectSignOut).toHaveBeenCalledWith(true);
      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('loading');
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

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().actOnUpdateOsAction).toHaveBeenCalled();
      expect(mockRefreshServerState).not.toHaveBeenCalled(); // Single action, no refresh needed
      expect(store.callbackCallsCompleted).toBe(true);
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

      await store.saveCallbackData(mockData);

      expect(mockUpdateOsActionsStore.setUpdateOsAction).toHaveBeenCalled();
      expect(mockUpdateOsActionsStore.actOnUpdateOsAction).toHaveBeenCalledWith(true);
      expect(mockRefreshServerState).not.toHaveBeenCalled(); // Single action, no refresh needed
      expect(store.callbackCallsCompleted).toBe(true);
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

      await store.saveCallbackData(mockData);

      expect(vi.mocked(useAccountStore)().setAccountAction).toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).toHaveBeenCalled();
      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
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
      await store.saveCallbackData(mockData);

      expect(mockInstall).toHaveBeenCalledWith(mockData.actions[0]);
      expect(vi.mocked(useAccountStore)().setAccountAction).not.toHaveBeenCalled();
      expect(vi.mocked(useUpdateOsActionsStore)().setUpdateOsAction).not.toHaveBeenCalled();
      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
    });

    it('should handle activate as a key install action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'activate',
            keyUrl: 'mock-key-url',
          },
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(mockInstall).toHaveBeenCalledWith(mockData.actions[0]);
      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
    });

    it('should handle trialStart as a key install action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'trialStart',
            keyUrl: 'https://example.com/trial.key',
          },
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(mockInstall).toHaveBeenCalledWith(mockData.actions[0]);
      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
    });

    it('should handle trialExtend as a key install action', async () => {
      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'trialExtend',
            keyUrl: 'https://example.com/trial-extend.key',
          },
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(mockInstall).toHaveBeenCalledWith(mockData.actions[0]);
      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
    });

    it('should keep key install callbacks successful even when refresh state is not done yet', async () => {
      mockRefreshServerStateStatus.value = 'timeout';

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

      await store.saveCallbackData(mockData);

      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
      expect(store.callbackCallsCompleted).toBe(true);
    });

    it('captures callback action failures as store error state', async () => {
      mockInstall.mockRejectedValueOnce(new Error('install exploded'));

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

      await expect(store.saveCallbackData(mockData)).resolves.toBeUndefined();

      expect(store.callbackStatus).toBe('error');
      expect(store.callbackCallsCompleted).toBe(true);
      expect(store.callbackError).toBe('install exploded');
      expect(mockRefreshServerState).not.toHaveBeenCalled();
    });

    it('normalizes string callback action failures', async () => {
      mockInstall.mockRejectedValueOnce('install string failure');

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

      await expect(store.saveCallbackData(mockData)).resolves.toBeUndefined();

      expect(store.callbackStatus).toBe('error');
      expect(store.callbackCallsCompleted).toBe(true);
      expect(store.callbackError).toBe('install string failure');
    });

    it('normalizes unknown callback action failures', async () => {
      mockInstall.mockRejectedValueOnce({ boom: true });

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

      await expect(store.saveCallbackData(mockData)).resolves.toBeUndefined();

      expect(store.callbackStatus).toBe('error');
      expect(store.callbackCallsCompleted).toBe(true);
      expect(store.callbackError).toBe('Unknown callback action error');
    });

    it('does not wait for key callback refresh reconciliation before succeeding', async () => {
      let resolveRefresh: ((value: boolean) => void) | undefined;
      const pendingRefresh = new Promise<boolean>((resolve) => {
        resolveRefresh = resolve;
      });
      mockRefreshServerState.mockReturnValueOnce(pendingRefresh);

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

      await store.saveCallbackData(mockData);

      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('success');
      expect(store.callbackCallsCompleted).toBe(false);

      resolveRefresh?.(true);
      await nextTick();
      await pendingRefresh;
      await nextTick();

      expect(store.callbackCallsCompleted).toBe(true);
    });

    it('does not wait for account callback refresh reconciliation before succeeding', async () => {
      let resolveRefresh: ((value: boolean) => void) | undefined;
      const pendingRefresh = new Promise<boolean>((resolve) => {
        resolveRefresh = resolve;
      });
      mockRefreshServerState.mockReturnValueOnce(pendingRefresh);

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

      await store.saveCallbackData(mockData);

      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('success');
      expect(store.callbackCallsCompleted).toBe(false);

      resolveRefresh?.(false);
      await nextTick();
      await pendingRefresh;
      await nextTick();

      expect(store.callbackCallsCompleted).toBe(true);
    });

    it('resolves mixed key and account callbacks only after both statuses succeed', async () => {
      mockAccountActionStatus.value = 'waiting';

      const mockData: QueryPayloads = {
        type: 'forUpc',
        actions: [
          {
            type: 'purchase',
            keyUrl: 'mock-key-url',
          },
          {
            type: 'signIn',
            user: { email: 'test@example.com', preferred_username: 'test' },
            apiKey: 'test-key',
          } as ExternalSignIn,
        ],
        sender: 'test',
      };

      await store.saveCallbackData(mockData);

      expect(mockRefreshServerState).toHaveBeenCalledWith({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(store.callbackStatus).toBe('loading');

      mockAccountActionStatus.value = 'success';
      await nextTick();

      expect(store.callbackStatus).toBe('success');
    });

    it('keeps update callbacks loading after direct actions succeed', async () => {
      mockAccountActionStatus.value = 'success';

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

      await store.saveCallbackData(mockData);

      expect(mockRefreshServerState).toHaveBeenCalledWith({ poll: false });
      expect(store.callbackStatus).toBe('loading');
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
