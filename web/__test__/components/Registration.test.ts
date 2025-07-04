/**
 * Registration Component Test Coverage
 */

import { defineComponent } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { ServerconnectPluginInstalled } from '~/types/server';
import type { Pinia } from 'pinia';

import Registration from '~/components/Registration.ce.vue';
import MockedRegistrationItem from '~/components/Registration/Item.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

vi.mock('crypto-js/aes.js', () => ({ default: {} }));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: { value: {} },
    loading: { value: false },
  }),
  useLazyQuery: () => ({
    result: { value: {} },
    loading: { value: false },
    load: vi.fn(),
    refetch: vi.fn(),
    onResult: vi.fn(),
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

vi.mock('~/components/Registration/Item.vue', () => ({
  default: defineComponent({
    props: ['label', 'text', 'component', 'componentProps', 'error', 'warning', 'componentOpacity'],
    name: 'RegistrationItem',
    template: `
      <div class="registration-item">
        <dt v-if="label">{{ label }}</dt>
        <dd>
          <span v-if="text">{{ text }}</span>
          <template v-if="component">
             <component :is="component" v-bind="componentProps" :class="[componentOpacity && !error ? 'opacity-75' : '']" />
          </template>
        </dd>
      </div>
    `,
    setup(props) {
      return { ...props };
    },
  }),
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

const t = (key: string) => key;

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t }),
}));

describe('Registration.ce.vue', () => {
  let wrapper: VueWrapper<unknown>;
  let pinia: Pinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let replaceRenewStore: ReturnType<typeof useReplaceRenewStore>;
  let purchaseStore: ReturnType<typeof usePurchaseStore>;

  const findItemByLabel = (labelKey: string) => {
    const items = wrapper.findAllComponents({ name: 'RegistrationItem' });

    return items.find((item) => item.props('label') === t(labelKey));
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

    // Mount after store setup
    wrapper = mount(Registration, {
      global: {
        plugins: [pinia],
        components: {
          RegistrationItem: MockedRegistrationItem,
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

    const items = wrapper.findAllComponents({ name: 'RegistrationItem' });
    const keyActionsItem = items.find((item) => {
      const componentProp = item.props('component');

      return componentProp?.template?.includes('data-testid="key-actions"');
    });

    expect(keyActionsItem, 'RegistrationItem for KeyActions not found').toBeDefined();

    const componentProps = keyActionsItem!.props('componentProps') as {
      filterOut?: string[];
      t: unknown;
    };
    const expectedActions = serverStore.keyActions?.filter(
      (action) => !componentProps?.filterOut?.includes(action.name)
    );

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
});
