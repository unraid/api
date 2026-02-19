/**
 * Registration Component Test Coverage
 */

import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { ServerconnectPluginInstalled } from '~/types/server';
import type { Pinia } from 'pinia';

import Registration from '~/components/Registration.standalone.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';
import { createTestI18n, testTranslate } from '../utils/i18n';

const { activationCodeStateHolder } = vi.hoisted(() => ({
  activationCodeStateHolder: {
    current: null as { value: { code: string } | null } | null,
  },
}));

vi.mock('crypto-js/aes.js', () => ({ default: {} }));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', async () => {
  const { computed, ref } = await import('vue');
  const { defineStore } = await import('pinia');

  activationCodeStateHolder.current = ref<{ code: string } | null>(null);

  const useActivationCodeDataStore = defineStore('activationCodeDataMockForRegistration', () => {
    return {
      activationCode: computed(() => activationCodeStateHolder.current?.value ?? null),
    };
  });

  return { useActivationCodeDataStore };
});

// Mock vue-i18n for store tests
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>();
  return {
    ...actual,
    useI18n: () => ({
      t: testTranslate,
    }),
  };
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: { value: {} },
    loading: { value: false },
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
  useLazyQuery: () => ({
    result: { value: {} },
    loading: { value: false },
    load: vi.fn(),
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
  provideApolloClient: vi.fn(),
}));

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@unraid/ui')>();

  return {
    ...actual,
    BrandButton: { template: '<button><slot /></button>', props: ['text', 'title', 'icon', 'disabled'] },
    CardWrapper: { template: '<div><slot /></div>' },
    PageContainer: { template: '<div><slot /></div>' },
    SettingsGrid: { template: '<div class="settings-grid"><slot /></div>' },
  };
});

vi.mock('~/components/KeyActions.vue', () => ({
  default: { template: '<div data-testid="key-actions"><slot/></div>', props: ['t', 'filterOut'] },
}));

vi.mock('~/components/Registration/KeyLinkedStatus.vue', () => ({
  default: { template: '<div data-testid="key-linked-status"></div>', props: ['t'] },
}));

vi.mock('~/components/Registration/ReplaceCheck.vue', () => ({
  default: { template: '<div data-testid="replace-check"></div>', props: ['t'] },
}));

vi.mock('~/components/Registration/UpdateExpirationAction.vue', () => ({
  default: { template: '<div data-testid="update-expiration"></div>', props: ['t'] },
}));

vi.mock('~/components/UserProfile/UptimeExpire.vue', () => ({
  default: {
    template: '<div data-testid="uptime-expire"></div>',
    props: ['t', 'forExpire', 'shortText'],
  },
}));

// Define initial state for the server store for testing
const initialServerState = {
  dateTimeFormat: { date: 'MMM D, YYYY', time: 'h:mm A' },
  deviceCount: 0,
  guid: '',
  flashVendor: '',
  flashProduct: '',
  keyfile: '',
  regGuid: '',
  regTm: '',
  regTo: '',
  regTy: '',
  regExp: null,
  regUpdatesExpired: false,
  serverErrors: [],
  state: 'ENOKEYFILE',
  stateData: { heading: 'Default Heading', message: 'Default Message' },
  stateDataError: false,
  tooManyDevices: false,
};

const mockFormattedDateTime = vi.fn(() => 'Formatted Date');
vi.mock('~/composables/dateTime', () => ({
  default: vi.fn(() => ({
    outputDateTimeFormatted: { value: mockFormattedDateTime() },
  })),
}));

const t = testTranslate;

describe('Registration.standalone.vue', () => {
  let wrapper: VueWrapper<unknown>;
  let pinia: Pinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let replaceRenewStore: ReturnType<typeof useReplaceRenewStore>;
  let purchaseStore: ReturnType<typeof usePurchaseStore>;

  const findItemByLabel = (labelKey: string) => {
    const allLabels = wrapper.findAll('.font-semibold');
    const label = allLabels.find((el) => el.html().includes(t(labelKey)));

    if (!label) return undefined;

    const nextSibling = label.element.nextElementSibling;

    return {
      exists: () => true,
      props: (prop: string) => {
        if (prop === 'text' && nextSibling) {
          return nextSibling.textContent?.trim();
        }
        return undefined;
      },
    };
  };

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        server: { ...initialServerState },
      },
      stubActions: true,
    });
    setActivePinia(pinia);

    serverStore = useServerStore();
    replaceRenewStore = useReplaceRenewStore();
    purchaseStore = usePurchaseStore();

    serverStore.deprecatedUnraidSSL = undefined;

    replaceRenewStore.check = vi.fn();

    vi.clearAllMocks();

    activationCodeStateHolder.current!.value = null;

    // Mount after store setup
    wrapper = mount(Registration, {
      global: {
        plugins: [pinia, createTestI18n()],
        stubs: {
          ShieldCheckIcon: { template: '<div class="shield-check-icon"/>' },
          ShieldExclamationIcon: { template: '<div class="shield-exclamation-icon"/>' },
        },
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it('renders default heading and message when state is ENOKEYFILE', () => {
    const heading = wrapper.find('h3');
    const subheading = wrapper.find('.prose');

    expect(heading.text()).toContain("Let's Unleash Your Hardware");
    expect(subheading.text()).toContain('Choose an option below');
    expect(findItemByLabel(t('License key type'))).toBeUndefined();
    expect(findItemByLabel(t('Flash GUID'))).toBeUndefined();
    expect(wrapper.find('[data-testid="key-actions"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="replace-check"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="key-linked-status"]').exists()).toBe(false);
  });

  it('triggers expected action when key action is clicked', async () => {
    serverStore.state = 'TRIAL';

    await wrapper.vm.$nextTick();

    const keyActionsElement = wrapper.find('[data-testid="key-actions"]');

    expect(keyActionsElement.exists(), 'KeyActions element not found').toBe(true);

    const expectedActions = serverStore.keyActions?.filter((action) => !['renew'].includes(action.name));

    expect(expectedActions, 'No expected actions found in store for TRIAL state').toBeDefined();
    expect(expectedActions!.length).toBeGreaterThan(0);

    const purchaseAction = expectedActions!.find((a) => a.name === 'purchase');

    expect(purchaseAction, 'Purchase action not found in expected actions').toBeDefined();

    purchaseAction!.click?.();

    expect(purchaseStore.purchase).toHaveBeenCalled();
  });

  it('renders registered state information when state is PRO', async () => {
    serverStore.state = 'PRO';
    serverStore.regTy = 'Pro';
    serverStore.regTo = 'Test User';
    serverStore.regGuid = '12345-ABCDE';
    serverStore.registered = true;
    serverStore.connectPluginInstalled = 'INSTALLED' as ServerconnectPluginInstalled;
    serverStore.guid = 'FLASH-GUID-123';
    serverStore.deviceCount = 5;

    await wrapper.vm.$nextTick();

    const keyTypeItem = findItemByLabel(t('License key type'));

    expect(keyTypeItem).toBeDefined();
    expect(keyTypeItem?.props('text')).toBe('Pro');

    const registeredToItem = findItemByLabel(t('Registered to'));

    expect(registeredToItem).toBeDefined();
    expect(registeredToItem?.props('text')).toBe('Test User');
    expect(findItemByLabel(t('Flash GUID'))).toBeDefined();
    expect(findItemByLabel(t('Attached Storage Devices'))).toBeDefined();
    expect(wrapper.find('[data-testid="key-actions"]').exists()).toBe(false);
  });

  it('adds Activate Trial fallback for ENOKEYFILE partner activation', async () => {
    activationCodeStateHolder.current!.value = {
      code: 'PARTNER-CODE-123',
    };

    serverStore.state = 'ENOKEYFILE';
    serverStore.registered = false;
    serverStore.connectPluginInstalled = '' as ServerconnectPluginInstalled;

    await wrapper.vm.$nextTick();

    const actionNames = serverStore.keyActions?.map((action) => action.name);
    expect(actionNames).toEqual(['activate', 'recover', 'trialStart']);
  });
});
