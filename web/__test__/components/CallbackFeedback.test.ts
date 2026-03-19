import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CallbackFeedback from '~/components/UserProfile/CallbackFeedback.vue';
import { createTestI18n } from '../utils/i18n';

vi.mock('@heroicons/vue/24/solid', () => ({
  CheckIcon: { template: '<svg />' },
  ChevronDoubleDownIcon: { template: '<svg />' },
  ClipboardIcon: { template: '<svg />' },
  CogIcon: { template: '<svg />' },
  WrenchScrewdriverIcon: { template: '<svg />' },
  XMarkIcon: { template: '<svg />' },
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    name: 'BrandButton',
    props: ['text', 'href'],
    emits: ['click'],
    template: '<button class="brand-button" @click="$emit(\'click\')">{{ text }}</button>',
  },
  BrandLoading: {
    name: 'BrandLoading',
    template: '<div class="brand-loading" />',
  },
}));

vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({
    copy: vi.fn(),
    copied: ref(false),
    isSupported: ref(true),
  }),
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');

  const isActualStore = (candidate: unknown): candidate is Parameters<typeof actual.storeToRefs>[0] =>
    Boolean(candidate && typeof candidate === 'object' && '$id' in candidate);

  const isRefLike = (input: unknown): input is { value: unknown } =>
    Boolean(input && typeof input === 'object' && 'value' in input);

  return {
    ...actual,
    storeToRefs: (store: unknown) => {
      if (isActualStore(store)) {
        return actual.storeToRefs(store);
      }

      if (!store || typeof store !== 'object') {
        return {};
      }

      const refs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(store)) {
        if (isRefLike(value)) {
          refs[key] = value;
        }
      }

      return refs;
    },
  };
});

vi.mock('~/components/Modal.vue', () => ({
  default: {
    name: 'Modal',
    props: ['title', 'description', 'open', 'error', 'success'],
    template: `
      <div v-if="open" class="modal" :data-error="error" :data-success="success">
        <h1>{{ title }}</h1>
        <p class="description">{{ description }}</p>
        <div class="main"><slot name="main" /></div>
        <div class="footer"><slot name="footer" /></div>
      </div>
    `,
  },
}));

vi.mock('~/components/Registration/UpdateExpiration.vue', () => ({
  default: {
    name: 'RegistrationUpdateExpiration',
    template: '<div class="update-expiration">update-expiration</div>',
  },
}));

vi.mock('~/components/UserProfile/UptimeExpire.vue', () => ({
  default: {
    name: 'UpcUptimeExpire',
    template: '<div class="uptime-expire">uptime-expire</div>',
  },
}));

vi.mock('~/components/UserProfile/CallbackFeedbackStatus.vue', () => ({
  default: {
    name: 'UpcCallbackFeedbackStatus',
    props: ['text', 'error', 'success'],
    template: `
      <div class="callback-feedback-status" :data-error="error" :data-success="success">
        <p>{{ text }}</p>
        <slot />
      </div>
    `,
  },
}));

const accountAction = ref<{ type?: string; user?: { preferred_username?: string } } | undefined>(
  undefined
);
const accountActionHide = ref(false);
const accountActionStatus = ref<'failed' | 'ready' | 'success' | 'updating' | 'waiting'>('ready');
const accountActionType = ref<string | undefined>(undefined);

const callbackStatus = ref<'closing' | 'error' | 'loading' | 'ready' | 'success'>('ready');
const callbackCallsCompleted = ref(true);
const mockSetCallbackStatus = vi.fn();

const keyActionType = ref<string | undefined>(undefined);
const keyUrl = ref<string | undefined>(undefined);
const keyInstallStatus = ref<'failed' | 'installing' | 'ready' | 'success'>('ready');
const keyType = ref<string | undefined>(undefined);

const connectPluginInstalled = ref(false);
const refreshServerStateStatus = ref<'done' | 'ready' | 'refreshing' | 'timeout'>('done');
const username = ref('test-user');
const osVersion = ref('6.12.3');
const stateData = ref({
  heading: 'common.error',
  message: 'userProfile.callbackFeedback.somethingWentWrong',
});
const stateDataError = ref(false);

const updateOsStatus = ref<'confirming' | 'ready'>('ready');
const callbackTypeDowngrade = ref(false);
const callbackUpdateRelease = ref<{ name?: string } | null>(null);
const mockInstallOsUpdate = vi.fn();
const mockSetUpdateOsStatus = vi.fn();

vi.mock('~/store/callbackInbound', () => ({
  useCallbackInboundStore: () => ({
    accountAction,
    accountActionHide,
    accountActionStatus,
    accountActionType,
  }),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    callbackCallsCompleted,
    callbackStatus,
    setCallbackStatus: mockSetCallbackStatus,
  }),
}));

vi.mock('~/store/installKey', () => ({
  useInstallKeyStore: () => ({
    keyActionType,
    keyUrl,
    keyInstallStatus,
    keyType,
  }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    connectPluginInstalled,
    refreshServerStateStatus,
    username,
    osVersion,
    stateData,
    stateDataError,
  }),
}));

vi.mock('~/store/updateOsActions', () => ({
  useUpdateOsActionsStore: () => ({
    status: updateOsStatus,
    callbackTypeDowngrade,
    callbackUpdateRelease,
    installOsUpdate: mockInstallOsUpdate,
    setStatus: mockSetUpdateOsStatus,
  }),
}));

describe('CallbackFeedback.vue', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    accountAction.value = undefined;
    accountActionHide.value = false;
    accountActionStatus.value = 'ready';
    accountActionType.value = undefined;

    callbackStatus.value = 'ready';
    callbackCallsCompleted.value = true;
    keyActionType.value = undefined;
    keyUrl.value = undefined;
    keyInstallStatus.value = 'ready';
    keyType.value = undefined;

    connectPluginInstalled.value = false;
    refreshServerStateStatus.value = 'done';
    username.value = 'test-user';
    osVersion.value = '6.12.3';
    stateData.value = {
      heading: 'common.error',
      message: 'userProfile.callbackFeedback.somethingWentWrong',
    };
    stateDataError.value = false;

    updateOsStatus.value = 'ready';
    callbackTypeDowngrade.value = false;
    callbackUpdateRelease.value = null;

    mockSetCallbackStatus.mockClear();
    mockInstallOsUpdate.mockClear();
    mockSetUpdateOsStatus.mockClear();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = () =>
    mount(CallbackFeedback, {
      props: {
        open: true,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

  it('renders key install success copy without the generic error message', () => {
    callbackStatus.value = 'success';
    keyActionType.value = 'purchase';
    keyInstallStatus.value = 'success';
    keyType.value = 'Pro';
    keyUrl.value = 'https://example.com/pro.key';

    const wrapper = mountComponent();

    expect(wrapper.find('h1').text()).toBe('Success!');
    expect(wrapper.find('.description').text()).toBe(
      'Key installed successfully. A reboot may be required to apply this change.'
    );
    expect(wrapper.text()).toContain('Pro Key Installed Successfully');
    expect(wrapper.text()).not.toContain('Something went wrong');
    expect(wrapper.find('.modal').attributes('data-success')).toBe('true');
    expect(wrapper.find('.modal').attributes('data-error')).toBe('false');
  });

  it('hides the post-install key error until reconciliation finishes', () => {
    callbackStatus.value = 'success';
    keyActionType.value = 'purchase';
    keyInstallStatus.value = 'success';
    keyType.value = 'Pro';
    stateDataError.value = true;
    refreshServerStateStatus.value = 'ready';
    callbackCallsCompleted.value = false;

    const wrapper = mountComponent();

    expect(wrapper.text()).not.toContain('Post Install License Key Error');
    expect(wrapper.text()).not.toContain('Something went wrong');
    expect(wrapper.text()).not.toContain('Fix Error');
  });

  it('renders the post-install key error after reconciliation still reports a problem', () => {
    callbackStatus.value = 'success';
    keyActionType.value = 'purchase';
    keyInstallStatus.value = 'success';
    keyType.value = 'Pro';
    stateDataError.value = true;
    refreshServerStateStatus.value = 'done';
    callbackCallsCompleted.value = true;

    const wrapper = mountComponent();

    expect(wrapper.text()).toContain('Post Install License Key Error');
    expect(wrapper.text()).toContain('Something went wrong');
    expect(wrapper.text()).toContain('Fix Error');
  });

  it('renders the generic error state for failed key installs', () => {
    callbackStatus.value = 'error';
    keyActionType.value = 'purchase';
    keyInstallStatus.value = 'failed';
    keyType.value = 'Pro';
    keyUrl.value = 'https://example.com/pro.key';

    const wrapper = mountComponent();

    expect(wrapper.find('h1').text()).toBe('Error');
    expect(wrapper.find('.description').text()).toBe('Something went wrong');
    expect(wrapper.text()).toContain('Failed to Install Pro Key');
    expect(wrapper.find('.modal').attributes('data-error')).toBe('true');
    expect(wrapper.find('.modal').attributes('data-success')).toBe('false');
  });

  it('reloads the page when the modal is dismissed after a callback action', async () => {
    const mockReload = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: mockReload,
      },
    });

    callbackStatus.value = 'success';
    keyActionType.value = 'purchase';
    keyInstallStatus.value = 'success';
    keyType.value = 'Pro';

    const wrapper = mountComponent();

    wrapper.findComponent({ name: 'Modal' }).vm.$emit('close');
    await wrapper.vm.$nextTick();

    expect(mockSetCallbackStatus).toHaveBeenCalledWith('ready');
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
