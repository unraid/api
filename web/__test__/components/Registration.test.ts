/**
 * Registration Component Test Coverage
 */

import { defineComponent } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { Pinia } from 'pinia';

import Registration from '~/components/Registration.ce.vue';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

vi.mock('crypto-js/aes.js', () => ({ default: {} }));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
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
  let wrapper: VueWrapper<any>;
  let pinia: Pinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let replaceRenewStore: ReturnType<typeof useReplaceRenewStore>;

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

    serverStore.deprecatedUnraidSSL = undefined;

    replaceRenewStore.check = vi.fn();

    vi.clearAllMocks();

    // Mount after store setup
    wrapper = mount(Registration, {
      global: {
        plugins: [pinia],
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
    expect(wrapper.find('[data-testid="key-actions"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="replace-check"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="key-linked-status"]').exists()).toBe(false);
  });
});
