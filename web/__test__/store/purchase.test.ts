/**
 * Purchase store test coverage
 */

import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { PURCHASE_CALLBACK } from '~/helpers/urls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePurchaseStore } from '~/store/purchase';

// Mock dependencies
const mockSend = vi.fn();
const mockServerStore = {
  serverPurchasePayload: {
    guid: 'test-guid',
    name: 'test-server',
  },
  inIframe: false,
};

// Mock Apollo Composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({}),
    loading: ref(false),
  }),
  provideApolloClient: vi.fn(),
}));

// Mock Apollo client
vi.mock('~/helpers/create-apollo-client', () => ({
  client: {
    clearStore: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  },
}));

// Mock shared callbacks
vi.mock('@unraid/shared-callbacks', () => {
  return {
    useCallback: vi.fn(() => ({
      send: mockSend,
      watcher: vi.fn(),
      parse: vi.fn(),
    })),
  };
});

// Mock activation code data store
vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => ({
    activationCode: ref(null),
  }),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    send: mockSend,
    sendType: 'post',
  }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

describe('Purchase Store', () => {
  let store: ReturnType<typeof usePurchaseStore>;

  beforeEach(() => {
    // Reset mock values
    mockServerStore.inIframe = false;

    setActivePinia(createPinia());
    store = usePurchaseStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Actions', () => {
    it('should call activate action correctly', () => {
      store.activate();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'activate',
          },
        ],
        undefined,
        'post'
      );
    });

    it('should call redeem action correctly', () => {
      store.redeem();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'redeem',
          },
        ],
        undefined,
        'post'
      );
    });

    it('should call purchase action correctly', () => {
      store.purchase();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'purchase',
          },
        ],
        undefined,
        'post'
      );
    });

    it('should call upgrade action correctly', () => {
      store.upgrade();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'upgrade',
          },
        ],
        undefined,
        'post'
      );
    });

    it('should call renew action correctly', () => {
      store.renew();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'renew',
          },
        ],
        undefined,
        'post'
      );
    });

    it('should handle iframe redirection correctly', () => {
      // Set up the iframe state
      mockServerStore.inIframe = true;

      setActivePinia(createPinia());
      const iframeStore = usePurchaseStore();

      iframeStore.purchase();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        PURCHASE_CALLBACK.toString(),
        [
          {
            server: {
              guid: 'test-guid',
              name: 'test-server',
            },
            type: 'purchase',
          },
        ],
        'newTab',
        'post'
      );
    });
  });
});
