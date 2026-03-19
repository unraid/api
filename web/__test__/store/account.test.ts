import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountStore } from '~/store/account';

const { activationCodeStoreMock } = vi.hoisted(() => ({
  activationCodeStoreMock: {
    activationCode: null as { code?: string; partner?: string; system?: string } | null,
  },
}));

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
    serverAccountPayload: {
      guid: 'test-guid',
      name: 'test-server',
    },
    serverReplacePayload: {
      guid: 'test-tpm-guid',
      name: 'test-server',
    },
    get inIframe() {
      return mockInIframe.value;
    },
  }),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => activationCodeStoreMock,
}));

describe('Account Store', () => {
  let store: ReturnType<typeof useAccountStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockInIframe.value = false;
    activationCodeStoreMock.activationCode = null;
    store = useAccountStore();
    vi.clearAllMocks();
  });

  it('sends myKeys payload for manage-like actions', () => {
    const assertMyKeys = () => {
      expect(mockSend).toHaveBeenLastCalledWith(
        ACCOUNT_CALLBACK.toString(),
        [{ server: { guid: 'test-guid', name: 'test-server' }, type: 'myKeys' }],
        undefined,
        'fromUpc'
      );
    };

    store.myKeys();
    assertMyKeys();

    store.manage();
    assertMyKeys();

    store.recover();
    assertMyKeys();

    store.replace();
    assertMyKeys();

    store.trialExtend();
    assertMyKeys();

    store.trialStart();
    assertMyKeys();
  });

  it('sends replaceTpm with TPM guid as primary guid', () => {
    store.replaceTpm();

    expect(mockSend).toHaveBeenCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [{ server: { guid: 'test-tpm-guid', name: 'test-server' }, type: 'myKeys' }],
      undefined,
      'fromUpc'
    );
  });

  it('includes activationCodeData in callback payload when available', () => {
    activationCodeStoreMock.activationCode = {
      code: 'PARTNER-CODE-123',
      partner: 'Partner Name',
      system: 'Partner System',
    };

    store.myKeys();

    expect(mockSend).toHaveBeenCalledWith(
      ACCOUNT_CALLBACK.toString(),
      [
        {
          server: {
            guid: 'test-guid',
            name: 'test-server',
            activationCodeData: {
              code: 'PARTNER-CODE-123',
              partner: 'Partner Name',
              system: 'Partner System',
            },
          },
          type: 'myKeys',
        },
      ],
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
