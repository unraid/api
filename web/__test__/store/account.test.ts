/**
 * Account store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountStore } from '~/store/account';

// Mock setup
vi.mock('@vue/apollo-composable', () => {
  const mockMutate = vi.fn();
  const mockOnDone = vi.fn();
  const mockOnError = vi.fn();
  return {
    useMutation: () => ({
      mutate: mockMutate,
      onDone: mockOnDone,
      onError: mockOnError,
    }),
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
    unraidApiClient: null,
  }),
}));

describe('Account Store', () => {
  let store: ReturnType<typeof useAccountStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountStore();
    vi.clearAllMocks();
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
  });
});
