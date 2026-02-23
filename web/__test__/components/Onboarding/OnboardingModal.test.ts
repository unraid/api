import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  mutateMock,
  activationCodeModalStore,
  activationCodeDataStore,
  upgradeOnboardingStore,
  onboardingDraftStore,
  purchaseStore,
  serverStore,
  themeStore,
  cleanupOnboardingStorageMock,
} = vi.hoisted(() => ({
  mutateMock: vi.fn().mockResolvedValue(undefined),
  activationCodeModalStore: {
    isVisible: { value: true },
    isTemporarilyBypassed: { value: false },
    setIsHidden: vi.fn(),
  },
  activationCodeDataStore: {
    activationRequired: { value: false },
    hasActivationCode: { value: true },
    registrationState: { value: 'ENOKEYFILE' },
    partnerInfo: {
      value: {
        partner: { name: null, url: null },
        branding: { hasPartnerLogo: false },
      },
    },
    isFreshInstall: { value: true },
  },
  upgradeOnboardingStore: {
    shouldShowOnboarding: { value: false },
    isVersionDrift: { value: false },
    completedAtVersion: { value: null },
    canDisplayOnboardingModal: { value: true },
    refetchOnboarding: vi.fn().mockResolvedValue(undefined),
  },
  onboardingDraftStore: {
    currentStepIndex: { value: 0 },
  },
  purchaseStore: {
    generateUrl: vi.fn(() => 'https://example.com/activate'),
    openInNewTab: true,
  },
  serverStore: {
    keyfile: { value: null },
  },
  themeStore: {
    fetchTheme: vi.fn().mockResolvedValue(undefined),
  },
  cleanupOnboardingStorageMock: vi.fn(),
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('@unraid/ui', () => ({
  Dialog: {
    name: 'Dialog',
    props: ['modelValue', 'showCloseButton', 'size'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="dialog"><slot /></div>',
  },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: { template: '<svg />' },
  XMarkIcon: { template: '<svg />' },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mutateMock,
  }),
}));

vi.mock('~/components/Onboarding/OnboardingSteps.vue', () => ({
  default: {
    props: ['steps', 'activeStepIndex'],
    template: '<div data-testid="onboarding-steps" />',
  },
}));

vi.mock('~/components/Onboarding/stepRegistry', () => ({
  stepComponents: {
    OVERVIEW: { template: '<div data-testid="overview-step" />' },
    CONFIGURE_SETTINGS: { template: '<div data-testid="settings-step" />' },
    ADD_PLUGINS: { template: '<div data-testid="plugins-step" />' },
    ACTIVATE_LICENSE: { template: '<div data-testid="license-step" />' },
    SUMMARY: { template: '<div data-testid="summary-step" />' },
    NEXT_STEPS: { template: '<div data-testid="next-step" />' },
  },
}));

vi.mock('~/components/Onboarding/store/activationCodeModal', () => ({
  useActivationCodeModalStore: () => reactive(activationCodeModalStore),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => reactive(activationCodeDataStore),
}));

vi.mock('~/components/Onboarding/store/upgradeOnboarding', () => ({
  useUpgradeOnboardingStore: () => reactive(upgradeOnboardingStore),
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => reactive(onboardingDraftStore),
}));

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => purchaseStore,
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => reactive(serverStore),
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => themeStore,
}));

vi.mock('~/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: cleanupOnboardingStorageMock,
}));

describe('OnboardingModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    activationCodeModalStore.isVisible.value = true;
    activationCodeModalStore.isTemporarilyBypassed.value = false;
    activationCodeDataStore.activationRequired.value = false;
    activationCodeDataStore.hasActivationCode.value = true;
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    upgradeOnboardingStore.shouldShowOnboarding.value = false;
    upgradeOnboardingStore.isVersionDrift.value = false;
    upgradeOnboardingStore.completedAtVersion.value = null;
    upgradeOnboardingStore.canDisplayOnboardingModal.value = true;
    onboardingDraftStore.currentStepIndex.value = 0;

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        href: '',
        pathname: '/Dashboard',
      },
    });
  });

  const mountComponent = () => {
    return mount(OnboardingModal, {
      global: {
        plugins: [createTestI18n()],
      },
    });
  };

  it('renders when modal is visible', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-steps"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="overview-step"]').exists()).toBe(true);
  });

  it('does not render when modal is hidden and onboarding flag is false', () => {
    activationCodeModalStore.isVisible.value = false;
    upgradeOnboardingStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when modal display is blocked', () => {
    activationCodeModalStore.isVisible.value = true;
    upgradeOnboardingStore.shouldShowOnboarding.value = true;
    upgradeOnboardingStore.canDisplayOnboardingModal.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when temporary bypass is active', () => {
    activationCodeModalStore.isVisible.value = true;
    activationCodeModalStore.isTemporarilyBypassed.value = true;
    upgradeOnboardingStore.shouldShowOnboarding.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render on login route', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        href: '',
        pathname: '/login',
      },
    });

    activationCodeModalStore.isVisible.value = true;
    upgradeOnboardingStore.canDisplayOnboardingModal.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('shows activation step for ENOKEYFILE1', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE1';
    onboardingDraftStore.currentStepIndex.value = 3;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('shows activation step for ENOKEYFILE2', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE2';
    onboardingDraftStore.currentStepIndex.value = 3;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('omits activation step for non-activation registration states', () => {
    activationCodeDataStore.registrationState.value = 'BASIC';
    onboardingDraftStore.currentStepIndex.value = 3;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="summary-step"]').exists()).toBe(true);
  });

  it('opens exit confirmation when close button is clicked', async () => {
    const wrapper = mountComponent();

    const closeButton = wrapper.find('button[aria-label="Close onboarding"]');
    expect(closeButton.exists()).toBe(true);

    await closeButton.trigger('click');

    expect(wrapper.text()).toContain('Exit onboarding?');
    expect(wrapper.text()).toContain('Exit setup');
  });

  it('confirms exit and completes onboarding flow when onboarding flag is enabled', async () => {
    upgradeOnboardingStore.shouldShowOnboarding.value = true;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));

    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(upgradeOnboardingStore.refetchOnboarding).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    expect(activationCodeModalStore.setIsHidden).toHaveBeenCalledWith(true);
  });

  it('confirms exit without completion mutation when onboarding flag is disabled', async () => {
    upgradeOnboardingStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));

    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(mutateMock).not.toHaveBeenCalled();
    expect(upgradeOnboardingStore.refetchOnboarding).not.toHaveBeenCalled();
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    expect(activationCodeModalStore.setIsHidden).toHaveBeenCalledWith(true);
  });
});
