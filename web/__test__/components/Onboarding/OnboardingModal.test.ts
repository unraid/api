import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  mutateMock,
  internalBootVisibilityResult,
  onboardingModalStoreState,
  activationCodeDataStore,
  onboardingStatusStore,
  onboardingDraftStore,
  purchaseStore,
  serverStore,
  themeStore,
  cleanupOnboardingStorageMock,
} = vi.hoisted(() => ({
  mutateMock: vi.fn().mockResolvedValue(undefined),
  internalBootVisibilityResult: {
    value: {
      vars: {
        enableBootTransfer: 'yes',
      },
    },
  },
  onboardingModalStoreState: {
    isAutoVisible: { value: true },
    isForceOpened: { value: false },
    isBypassActive: { value: false },
    setIsHidden: vi.fn(),
    clearForceOpened: vi.fn(),
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
  onboardingStatusStore: {
    shouldShowOnboarding: { value: false },
    isVersionDrift: { value: false },
    completedAtVersion: { value: null },
    canDisplayOnboardingModal: { value: true },
    isPartnerBuild: { value: false },
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
  useQuery: () => ({
    result: internalBootVisibilityResult,
    loading: { value: false },
    error: { value: null },
  }),
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
    CONFIGURE_BOOT: { template: '<div data-testid="internal-boot-step" />' },
    ADD_PLUGINS: { template: '<div data-testid="plugins-step" />' },
    ACTIVATE_LICENSE: { template: '<div data-testid="license-step" />' },
    SUMMARY: { template: '<div data-testid="summary-step" />' },
    NEXT_STEPS: { template: '<div data-testid="next-step" />' },
  },
}));

vi.mock('~/components/Onboarding/store/onboardingModalVisibility', () => ({
  useOnboardingModalStore: () => reactive(onboardingModalStoreState),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => reactive(activationCodeDataStore),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: () => reactive(onboardingStatusStore),
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

    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingModalStoreState.isForceOpened.value = false;
    onboardingModalStoreState.isBypassActive.value = false;
    activationCodeDataStore.activationRequired.value = false;
    activationCodeDataStore.hasActivationCode.value = true;
    activationCodeDataStore.isFreshInstall.value = true;
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    onboardingStatusStore.shouldShowOnboarding.value = false;
    onboardingStatusStore.isVersionDrift.value = false;
    onboardingStatusStore.completedAtVersion.value = null;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;
    onboardingStatusStore.isPartnerBuild.value = false;
    onboardingDraftStore.currentStepIndex.value = 0;
    internalBootVisibilityResult.value = {
      vars: {
        enableBootTransfer: 'yes',
      },
    };

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
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingStatusStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when modal display is blocked', () => {
    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingStatusStore.shouldShowOnboarding.value = true;
    onboardingStatusStore.canDisplayOnboardingModal.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when system is not a fresh install', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingStatusStore.shouldShowOnboarding.value = true;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when temporary bypass is active', () => {
    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingModalStoreState.isBypassActive.value = true;
    onboardingStatusStore.shouldShowOnboarding.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('renders when force-opened even when not a fresh install', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
  });

  it('renders when force-opened even while temporary bypass is active', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingModalStoreState.isBypassActive.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
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

    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('shows activation step for ENOKEYFILE1', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE1';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('shows activation step for ENOKEYFILE2', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE2';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('omits activation step for non-activation registration states', () => {
    activationCodeDataStore.registrationState.value = 'BASIC';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="summary-step"]').exists()).toBe(true);
  });

  it('shows internal boot step for regular builds', () => {
    onboardingDraftStore.currentStepIndex.value = 2;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(true);
  });

  it('hides internal boot step for partner builds', () => {
    onboardingStatusStore.isPartnerBuild.value = true;
    onboardingDraftStore.currentStepIndex.value = 2;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('hides internal boot step when already booting internally', () => {
    internalBootVisibilityResult.value = {
      vars: {
        enableBootTransfer: 'no',
      },
    };
    onboardingDraftStore.currentStepIndex.value = 2;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
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
    onboardingStatusStore.shouldShowOnboarding.value = true;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));

    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(onboardingStatusStore.refetchOnboarding).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    expect(onboardingModalStoreState.clearForceOpened).toHaveBeenCalledTimes(1);
    expect(onboardingModalStoreState.setIsHidden).toHaveBeenCalledWith(true);
  });

  it('confirms exit without completion mutation when onboarding flag is disabled', async () => {
    onboardingStatusStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));

    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(mutateMock).not.toHaveBeenCalled();
    expect(onboardingStatusStore.refetchOnboarding).not.toHaveBeenCalled();
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    expect(onboardingModalStoreState.clearForceOpened).toHaveBeenCalledTimes(1);
    expect(onboardingModalStoreState.setIsHidden).toHaveBeenCalledWith(true);
  });

  it('preserves bypass cleanup behavior when exiting a force-opened modal', async () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingStatusStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(mutateMock).not.toHaveBeenCalled();
    expect(onboardingModalStoreState.clearForceOpened).toHaveBeenCalledTimes(1);
    expect(onboardingModalStoreState.setIsHidden).toHaveBeenCalledWith(true);
  });

  it('does not complete onboarding when exiting a force-opened modal', async () => {
    activationCodeDataStore.isFreshInstall.value = true;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingStatusStore.shouldShowOnboarding.value = true;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(mutateMock).not.toHaveBeenCalled();
    expect(onboardingStatusStore.refetchOnboarding).not.toHaveBeenCalled();
  });
});
