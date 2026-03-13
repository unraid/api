/**
 * Auth Component Test Coverage
 */

import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { GlobeAltIcon } from '@heroicons/vue/24/solid';
import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerconnectPluginInstalled } from '~/types/server';

import Auth from '~/components/Auth.standalone.vue';
import { useServerStore } from '~/store/server';
import { createTestI18n, testTranslate } from '../utils/i18n';

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>();
  return {
    ...actual,
    useI18n: () => ({
      t: testTranslate,
    }),
  };
});

vi.mock('crypto-js/aes', () => ({
  default: {},
}));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

const mockAccountStore = {
  signIn: vi.fn(),
};

vi.mock('~/store/account', () => ({
  useAccountStore: () => mockAccountStore,
}));

vi.mock('~/store/activationCode', () => ({
  useActivationCodeStore: vi.fn(() => ({
    code: ref(null),
    partnerName: ref(null),
  })),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => ({
    loading: ref(false),
    activationCode: ref(null),
    isFreshInstall: ref(false),
    partnerInfo: ref(null),
  }),
}));

describe('Auth Component', () => {
  let serverStore: ReturnType<typeof useServerStore>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays an authentication button when authAction is available', async () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
      },
    });

    // Patch the underlying state that `authAction` depends on
    serverStore = useServerStore();
    serverStore.$patch({
      state: 'ENOKEYFILE',
      registered: false,
      connectPluginInstalled: 'INSTALLED' as ServerconnectPluginInstalled,
    });

    await nextTick();

    const button = wrapper.findComponent({ name: 'BrandButton' });

    expect(button.exists()).toBe(true);
    expect(button.props('text')).toBe('Sign In with Unraid.net Account');
    expect(button.props('icon')).toBe(GlobeAltIcon);
  });

  it('displays error messages when stateData.error is true', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
      },
    });

    // Patch the underlying state that `stateData` depends on
    serverStore = useServerStore();
    serverStore.$patch({
      state: 'EEXPIRED',
      registered: false,
      connectPluginInstalled: 'INSTALLED' as ServerconnectPluginInstalled,
    });

    const errorHeading = wrapper.find('h3');

    expect(errorHeading.exists()).toBe(true);
    expect(errorHeading.text()).toBe('Stale Server');
    expect(wrapper.text()).toContain(
      'Please refresh the page to ensure you load your latest configuration'
    );
  });

  it('calls the click handler when button is clicked', async () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
      },
    });

    serverStore = useServerStore();
    serverStore.$patch({
      state: 'ENOKEYFILE',
      registered: false,
      connectPluginInstalled: 'INSTALLED' as ServerconnectPluginInstalled,
    });

    await nextTick();

    await wrapper.findComponent({ name: 'BrandButton' }).vm.$emit('click');

    expect(mockAccountStore.signIn).toHaveBeenCalledTimes(1);
  });

  it('does not render button when authAction is undefined', () => {
    const wrapper = mount(Auth, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
      },
    });

    serverStore = useServerStore();
    serverStore.$patch({
      state: 'PRO',
      registered: true,
    });

    const button = wrapper.findComponent({ name: 'BrandButton' });

    expect(button.exists()).toBe(false);
  });
});
