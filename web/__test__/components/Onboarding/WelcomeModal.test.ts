import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import WelcomeModal from '~/components/Onboarding/standalone/WelcomeModal.standalone.vue';
import { testTranslate } from '../../utils/i18n';

const { welcomeModalDataStore, themeStore } = vi.hoisted(() => ({
  welcomeModalDataStore: {
    partnerInfo: ref({
      partner: { name: null, url: null },
      branding: { hasPartnerLogo: false },
    }),
    isFreshInstall: ref(true),
    loading: ref(false),
  },
  themeStore: {
    fetchTheme: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@unraid/ui', () => ({
  Dialog: {
    name: 'Dialog',
    props: ['modelValue', 'showCloseButton', 'size', 'showFooter'],
    emits: ['update:modelValue'],
    template:
      '<div data-testid="dialog" :data-open="modelValue" :data-close="showCloseButton"><slot /></div>',
  },
}));

vi.mock('~/components/Onboarding/components/OnboardingPartnerLogo.vue', () => ({
  default: {
    template: '<div data-testid="partner-logo" />',
  },
}));

vi.mock('~/components/Onboarding/OnboardingSteps.vue', () => ({
  default: {
    template: '<div data-testid="onboarding-steps" />',
  },
}));

vi.mock('~/components/Onboarding/steps/OnboardingOverviewStep.vue', () => ({
  default: {
    props: ['onComplete', 'redirectToLogin'],
    methods: {
      handleClick() {
        if (this.redirectToLogin) {
          window.location.href = '/login';
          return;
        }
        this.onComplete?.();
      },
    },
    template:
      '<div data-testid="overview-step"><button data-testid="get-started" @click="handleClick">Get Started</button></div>',
  },
}));

vi.mock('~/components/Onboarding/store/welcomeModalData', () => ({
  useWelcomeModalDataStore: () => welcomeModalDataStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => themeStore,
}));

describe('WelcomeModal.standalone.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    welcomeModalDataStore.partnerInfo.value = {
      partner: { name: null, url: null },
      branding: { hasPartnerLogo: false },
    };
    welcomeModalDataStore.isFreshInstall.value = true;

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        href: '',
        pathname: '/login',
      },
    });
  });

  const mountComponent = () => {
    return mount(WelcomeModal, {
      props: { t: testTranslate as unknown as ComposerTranslation },
    });
  };

  it('calls fetchTheme on mount', () => {
    mountComponent();

    expect(themeStore.fetchTheme).toHaveBeenCalledTimes(1);
  });

  it('shows modal on login page', () => {
    window.location.pathname = '/login';
    welcomeModalDataStore.isFreshInstall.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe('true');
    expect(wrapper.find('[data-testid="dialog"]').attributes('data-close')).toBe('true');
  });

  it('shows modal on non-login page for fresh install', () => {
    window.location.pathname = '/Dashboard';
    welcomeModalDataStore.isFreshInstall.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe('true');
    expect(wrapper.find('[data-testid="dialog"]').attributes('data-close')).toBe('false');
  });

  it('keeps modal closed on non-login page when not fresh install', () => {
    window.location.pathname = '/Dashboard';
    welcomeModalDataStore.isFreshInstall.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe('false');
  });

  it('renders partner logo when partner branding is enabled', () => {
    welcomeModalDataStore.partnerInfo.value = {
      partner: { name: 'Test Partner', url: 'https://example.com' },
      branding: { hasPartnerLogo: true },
    };

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="partner-logo"]').exists()).toBe(true);
  });

  it('redirects to login when get started is clicked', async () => {
    const wrapper = mountComponent();

    await wrapper.find('[data-testid="get-started"]').trigger('click');

    expect(window.location.href).toBe('/login');
  });
});
