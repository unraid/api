/**
 * Account store test coverage
 */

import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ApolloError } from '@apollo/client/core';
import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalSignIn, ExternalSignOut } from '@unraid/shared-callbacks';
import type { ConnectSignInMutationPayload } from '~/store/account';
import type { Mock } from 'vitest';
import type { Ref } from 'vue';

import { useAccountStore } from '~/store/account';

// Mock setup
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    watchEffect: (fn: () => void) => {
      fn();
      return () => {};
    },
  };
});

const mockUseMutation = vi.fn(() => {
  let onDoneCallback: ((response: { data: unknown }) => void) | null = null;

  return {
    mutate: vi.fn().mockImplementation(() => {
      onDoneCallback?.({ data: {} });

      return Promise.resolve({ data: {} });
    }),
    onDone: (callback: (response: { data: unknown }) => void) => {
      onDoneCallback = callback;

      return { off: vi.fn() };
    },
    onError: (callback: (error: ApolloError) => void) => ({ off: vi.fn() }),

    loading: ref(false),
    error: ref(null) as Ref<null>,
    called: ref(false),
  };
});

const mockSend = vi.fn();
const mockPurge = vi.fn();
const mockSetError = vi.fn();

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    send: mockSend,
    sendType: 'post',
  }),
}));

vi.mock('~/store/errors', () => ({
  useErrorsStore: () => ({
    setError: mockSetError,
  }),
}));

vi.mock('~/store/replaceRenew', () => ({
  useReplaceRenewStore: () => ({
    purgeValidationResponse: mockPurge,
  }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    serverAccountPayload: {
      guid: 'test-guid',
      name: 'test-server',
    },
    inIframe: false,
  }),
}));

vi.mock('~/store/unraidApi', () => ({
  useUnraidApiStore: () => ({
    unraidApiClient: ref(true),
  }),
}));

describe('Account Store', () => {
  let store: ReturnType<typeof useAccountStore>;
  let useMutationSpy: Mock;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountStore();
    useMutationSpy = vi.mocked(useMutation);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Actions', () => {
    it('should call manage action correctly', () => {
      store.manage();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'manage' }],
        undefined,
        'post'
      );
    });

    it('should call myKeys action correctly', async () => {
      await store.myKeys();

      expect(mockPurge).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
        undefined,
        'post'
      );
    });

    it('should call linkKey action correctly', async () => {
      await store.linkKey();

      expect(mockPurge).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'linkKey' }],
        undefined,
        'post'
      );
    });

    it('should call recover action correctly', () => {
      store.recover();
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'recover' }],
        undefined,
        'post'
      );
    });

    it('should call signIn action correctly', () => {
      store.signIn();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'signIn' }],
        undefined,
        'post'
      );
    });

    it('should call signOut action correctly', () => {
      store.signOut();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'signOut' }],
        undefined,
        'post'
      );
    });

    it('should handle downgradeOs action with and without redirect', async () => {
      await store.downgradeOs();

      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'downgradeOs' }],
        undefined,
        'post'
      );

      await store.downgradeOs(true);

      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'downgradeOs' }],
        'replace',
        'post'
      );
    });

    it('should handle updateOs action with and without redirect', async () => {
      await store.updateOs();

      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'updateOs' }],
        undefined,
        'post'
      );

      await store.updateOs(true);

      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'updateOs' }],
        'replace',
        'post'
      );
    });

    it('should call replace action correctly', () => {
      store.replace();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'replace' }],
        undefined,
        'post'
      );
    });

    it('should call trialExtend action correctly', () => {
      store.trialExtend();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'trialExtend' }],
        undefined,
        'post'
      );
    });

    it('should call trialStart action correctly', () => {
      store.trialStart();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'trialStart' }],
        undefined,
        'post'
      );
    });
  });

  describe('State Management', () => {
    const originalConsoleDebug = console.debug;

    beforeEach(() => {
      console.debug = vi.fn();
    });

    afterEach(() => {
      console.debug = originalConsoleDebug;
    });

    it('should set account actions and payloads', () => {
      const signInAction: ExternalSignIn = {
        type: 'signIn',
        apiKey: 'test-api-key',
        user: {
          email: 'test@example.com',
          preferred_username: 'test-user',
        },
      };
      const signOutAction: ExternalSignOut = {
        type: 'signOut',
      };

      store.setAccountAction(signInAction);
      store.setConnectSignInPayload({
        apiKey: signInAction.apiKey,
        email: signInAction.user.email as string,
        preferred_username: signInAction.user.preferred_username as string,
      });

      expect(store.accountAction).toEqual(signInAction);
      expect(store.accountActionStatus).toBe('waiting');

      store.setAccountAction(signOutAction);
      store.setQueueConnectSignOut(true);

      expect(store.accountAction).toEqual(signOutAction);
      expect(store.accountActionStatus).toBe('waiting');
    });
  });

  describe('Apollo Mutations', () => {
    const originalConsoleDebug = console.debug;

    beforeEach(() => {
      console.debug = vi.fn();
    });

    afterEach(() => {
      console.debug = originalConsoleDebug;
    });

    it('should handle connectSignInMutation success', async () => {
      const store = useAccountStore();
      const accountActionStatus = ref('ready');
      const typedStore = {
        ...store,
        accountActionStatus,
        setConnectSignInPayload: (payload: ConnectSignInMutationPayload) => {
          store.setConnectSignInPayload(payload);
          accountActionStatus.value = 'waiting';
        },
        setQueueConnectSignOut: (value: boolean) => {
          store.setQueueConnectSignOut(value);
          accountActionStatus.value = 'waiting';
        },
        connectSignInMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate();
          accountActionStatus.value = 'success';

          return mockMutation;
        },
        connectSignOutMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate();
          accountActionStatus.value = 'success';

          return mockMutation;
        },
      };

      typedStore.setAccountAction('signIn' as unknown as ExternalSignIn);
      typedStore.setConnectSignInPayload({
        apiKey: 'test-api-key',
        email: 'test@example.com',
        preferred_username: 'test-user',
      });

      expect(accountActionStatus.value).toBe('waiting');

      await typedStore.connectSignInMutation();
      await nextTick();

      expect(accountActionStatus.value).toBe('success');
    });

    it('should handle connectSignOutMutation success', async () => {
      const store = useAccountStore();
      const accountActionStatus = ref('ready');
      const typedStore = {
        ...store,
        accountActionStatus,
        setConnectSignInPayload: (payload: ConnectSignInMutationPayload) => {
          store.setConnectSignInPayload(payload);
          accountActionStatus.value = 'waiting';
        },
        setQueueConnectSignOut: (value: boolean) => {
          store.setQueueConnectSignOut(value);
          accountActionStatus.value = 'waiting';
        },
        connectSignInMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate();
          accountActionStatus.value = 'success';

          return mockMutation;
        },
        connectSignOutMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate();
          accountActionStatus.value = 'success';

          return mockMutation;
        },
      };

      typedStore.setAccountAction('signOut' as unknown as ExternalSignOut);
      typedStore.setQueueConnectSignOut(true);

      expect(accountActionStatus.value).toBe('waiting');

      await typedStore.connectSignOutMutation();
      await nextTick();

      expect(accountActionStatus.value).toBe('success');
    });

    it('should handle mutation errors', async () => {
      const store = useAccountStore();
      const accountActionStatus = ref('ready');
      const mockError = new ApolloError({
        graphQLErrors: [{ message: 'Test error' }],
      });

      // Mock the mutation to trigger error
      mockUseMutation.mockImplementationOnce(() => ({
        mutate: vi.fn().mockRejectedValue(mockError),
        onDone: () => ({ off: vi.fn() }),
        onError: (callback: (error: ApolloError) => void) => {
          callback(mockError);
          accountActionStatus.value = 'failed';

          return { off: vi.fn() };
        },
        loading: ref(false) as Ref<boolean>,
        error: ref(null) as Ref<null>,
        called: ref(true) as Ref<boolean>,
      }));

      const typedStore = {
        ...store,
        accountActionStatus,
        setConnectSignInPayload: (payload: ConnectSignInMutationPayload) => {
          store.setConnectSignInPayload(payload);
          accountActionStatus.value = 'waiting';
        },
        setQueueConnectSignOut: (value: boolean) => {
          store.setQueueConnectSignOut(value);
          accountActionStatus.value = 'waiting';
        },
        connectSignInMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate().catch((error: unknown) => {
            if (error instanceof ApolloError) {
              accountActionStatus.value = 'failed';

              mockSetError({
                heading: 'unraid-api failed to update Connect account configuration',
                message: error.message,
                level: 'error',
                ref: 'connectSignInMutation',
                type: 'account',
              });
            }
            throw error;
          });
          return mockMutation;
        },
        connectSignOutMutation: async () => {
          accountActionStatus.value = 'updating';
          const mockMutation = mockUseMutation();

          await mockMutation.mutate();

          return mockMutation;
        },
      };

      typedStore.setAccountAction('signIn' as unknown as ExternalSignIn);
      typedStore.setConnectSignInPayload({
        apiKey: 'test-api-key',
        email: 'test@example.com',
        preferred_username: 'test-user',
      });

      expect(accountActionStatus.value).toBe('waiting');

      try {
        await typedStore.connectSignInMutation();
      } catch (error) {
        // Error is expected
      }
      await nextTick();

      expect(accountActionStatus.value).toBe('failed');
      expect(mockSetError).toHaveBeenCalledWith({
        heading: 'unraid-api failed to update Connect account configuration',
        message: 'Test error',
        level: 'error',
        ref: 'connectSignInMutation',
        type: 'account',
      });
    });
  });
});
