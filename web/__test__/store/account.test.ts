import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountStore } from '~/store/account';

const mockSend = vi.fn();
const mockGenerateUrl = vi.fn();
const mockInIframe = ref(false);

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    send: mockSend,
    generateUrl: mockGenerateUrl,
    sendType: 'fromUpc',
  }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    serverCallbackPayload: {
      guid: 'test-guid',
      name: 'test-server',
    },
    get inIframe() {
      return mockInIframe.value;
    },
  }),
}));

describe('Account Store', () => {
  let store: ReturnType<typeof useAccountStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockInIframe.value = false;
    store = useAccountStore();
    vi.clearAllMocks();
  });

  it('sends myKeys payload for manage-like actions', () => {
    store.myKeys();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );

    store.recover();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );

    store.replace();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );

    store.replaceTpm();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );

    store.trialExtend();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );
  });

  it('sends sign-in and sign-out payloads', () => {
    store.signIn();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'signIn' }],
      undefined,
      'fromUpc'
    );

    store.signOut();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'signOut' }],
      undefined,
      'fromUpc'
    );
  });

  it('handles update and downgrade redirect behavior', async () => {
    await store.updateOs();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'updateOs' }],
      undefined,
      'fromUpc'
    );

    await store.updateOs(true);
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'updateOs' }],
      'replace',
      'fromUpc'
    );

    await store.downgradeOs();
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'downgradeOs' }],
      undefined,
      'fromUpc'
    );

    await store.downgradeOs(true);
    expect(mockSend).toHaveBeenLastCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'downgradeOs' }],
      'replace',
      'fromUpc'
    );
  });

  it('opens account actions in new tab when in iframe', () => {
    mockInIframe.value = true;
    const iframeStore = useAccountStore();
    iframeStore.signIn();

    expect(mockSend).toHaveBeenCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'signIn' }],
      'newTab',
      'fromUpc'
    );
    expect(iframeStore.openInNewTab).toBe(true);
  });

  it('builds myKeys URL with single payload helper', () => {
    mockGenerateUrl.mockReturnValue('https://example.com/account');

    const url = store.generateMyKeysUrl();

    expect(url).toBe('https://example.com/account');
    expect(mockGenerateUrl).toHaveBeenCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
      'fromUpc',
      undefined
    );
  });
});
