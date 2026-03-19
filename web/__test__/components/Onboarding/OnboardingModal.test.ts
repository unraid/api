import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StepId } from '~/components/Onboarding/stepRegistry.js';

import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import { createTestI18n } from '../../utils/i18n';

type InternalBootVisibilityResult = {
  value: {
    bootedFromFlashWithInternalBootSetup: boolean | null;
    enableBootTransfer: string | null;
  } | null;
};

const {
  mutateMock,
  internalBootVisibilityResult,
  internalBootVisibilityLoading,
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
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'yes',
    },
  } as InternalBootVisibilityResult,
  internalBootVisibilityLoading: { value: false },
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
    isUpgrade: { value: false },
    isVersionDrift: { value: false },
    completedAtVersion: { value: null },
    canDisplayOnboardingModal: { value: true },
    isPartnerBuild: { value: false },
    refetchOnboarding: vi.fn().mockResolvedValue(undefined),
  },
  onboardingDraftStore: {
    currentStepIndex: { value: 0 },
    currentStepId: { value: null as StepId | null },
    internalBootApplySucceeded: { value: false },
    setCurrentStep: vi.fn((stepId: StepId, stepIndex: number) => {
      onboardingDraftStore.currentStepId.value = stepId;
      onboardingDraftStore.currentStepIndex.value = stepIndex;
    }),
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
    CONFIGURE_BOOT: { template: '<div data-testid="internal-boot-step" />' },
    ADD_PLUGINS: { template: '<div data-testid="plugins-step" />' },
    ACTIVATE_LICENSE: { template: '<div data-testid="license-step" />' },
    SUMMARY: { template: '<div data-testid="summary-step" />' },
    NEXT_STEPS: { template: '<div data-testid="next-step" />' },
  },
}));

vi.mock('~/components/Onboarding/store/onboardingModalVisibility', () => ({
  useOnboardingModalStore: () => onboardingModalStoreState,
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => activationCodeDataStore,
}));

vi.mock('~/components/Onboarding/store/onboardingContextData', () => ({
  useOnboardingContextDataStore: () => ({
    internalBootVisibility: internalBootVisibilityResult,
    loading: internalBootVisibilityLoading,
  }),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: () => onboardingStatusStore,
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => onboardingDraftStore,
}));

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => purchaseStore,
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => serverStore,
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

    onboardingModalStoreState.setIsHidden.mockImplementation((value: boolean | null) => {
      onboardingModalStoreState.isAutoVisible.value = value === false;
    });
    onboardingModalStoreState.clearForceOpened.mockImplementation(() => {
      onboardingModalStoreState.isForceOpened.value = false;
    });

    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingModalStoreState.isForceOpened.value = false;
    onboardingModalStoreState.isBypassActive.value = false;
    activationCodeDataStore.activationRequired.value = false;
    activationCodeDataStore.hasActivationCode.value = true;
    activationCodeDataStore.isFreshInstall.value = true;
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    onboardingStatusStore.shouldShowOnboarding.value = false;
    onboardingStatusStore.isUpgrade.value = false;
    onboardingStatusStore.isVersionDrift.value = false;
    onboardingStatusStore.completedAtVersion.value = null;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;
    onboardingStatusStore.isPartnerBuild.value = false;
    onboardingDraftStore.currentStepIndex.value = 0;
    onboardingDraftStore.currentStepId.value = null;
    onboardingDraftStore.internalBootApplySucceeded.value = false;
    internalBootVisibilityLoading.value = false;
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'yes',
    };
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

  it('renders for upgrade onboarding even when system is not a fresh install', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = true;
    onboardingStatusStore.isUpgrade.value = true;
    onboardingStatusStore.isVersionDrift.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
  });

  it('does not render when force-opened if modal display is blocked', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingStatusStore.canDisplayOnboardingModal.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('renders when force-opened even while temporary bypass is active', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingModalStoreState.isBypassActive.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
  });

  it('does not render when force-opened during temporary bypass if modal display is blocked', () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingModalStoreState.isBypassActive.value = true;
    onboardingStatusStore.canDisplayOnboardingModal.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('shows activation step for ENOKEYFILE1', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE1';
    onboardingDraftStore.currentStepId.value = 'ACTIVATE_LICENSE';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('shows activation step for ENOKEYFILE2', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE2';
    onboardingDraftStore.currentStepId.value = 'ACTIVATE_LICENSE';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('omits activation step for non-activation registration states', () => {
    activationCodeDataStore.registrationState.value = 'BASIC';
    onboardingDraftStore.currentStepId.value = 'ACTIVATE_LICENSE';
    onboardingDraftStore.currentStepIndex.value = 4;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="summary-step"]').exists()).toBe(true);
  });

  it('shows internal boot step for regular builds', () => {
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(true);
  });

  it('hides internal boot step when boot transfer state is unknown', () => {
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: null,
      enableBootTransfer: null,
    };
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
  });

  it('shows internal boot step for partner builds when boot transfer is available', () => {
    onboardingStatusStore.isPartnerBuild.value = true;
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(true);
  });

  it('hides internal boot step when already booting internally', () => {
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'no',
    };
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('hides internal boot step when still booted from flash but internal boot is already configured', () => {
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: true,
      enableBootTransfer: 'yes',
    };
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('keeps the resumed internal boot step visible while boot visibility is still loading', () => {
    internalBootVisibilityLoading.value = true;
    internalBootVisibilityResult.value = null;
    onboardingDraftStore.currentStepIndex.value = 2;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(false);
  });

  it('opens exit confirmation when close button is clicked', async () => {
    const wrapper = mountComponent();

    const closeButton = wrapper.find('button[aria-label="Close onboarding"]');
    expect(closeButton.exists()).toBe(true);

    await closeButton.trigger('click');

    expect(wrapper.text()).toContain('Exit onboarding?');
    expect(wrapper.text()).toContain('Exit setup');
  });

  it('shows the internal boot restart guidance when exiting after internal boot was applied', async () => {
    onboardingDraftStore.internalBootApplySucceeded.value = true;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');

    expect(wrapper.text()).toContain('Internal boot has been configured.');
    expect(wrapper.text()).toContain('Please restart manually when convenient');
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
    await wrapper.vm.$nextTick();

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(onboardingStatusStore.refetchOnboarding).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    wrapper.unmount();

    const remountedWrapper = mountComponent();
    expect(remountedWrapper.find('[data-testid="onboarding-steps"]').exists()).toBe(false);
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
    await wrapper.vm.$nextTick();

    expect(mutateMock).not.toHaveBeenCalled();
    expect(onboardingStatusStore.refetchOnboarding).not.toHaveBeenCalled();
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith({
      clearTemporaryBypassSessionState: true,
    });
    wrapper.unmount();

    const remountedWrapper = mountComponent();
    expect(remountedWrapper.find('[data-testid="onboarding-steps"]').exists()).toBe(false);
  });

  it('preserves bypass cleanup behavior when exiting a force-opened modal', async () => {
    activationCodeDataStore.isFreshInstall.value = false;
    onboardingModalStoreState.isAutoVisible.value = false;
    onboardingModalStoreState.isForceOpened.value = true;
    onboardingModalStoreState.isBypassActive.value = true;
    onboardingStatusStore.shouldShowOnboarding.value = false;

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(mutateMock).not.toHaveBeenCalled();
    wrapper.unmount();

    const remountedWrapper = mountComponent();
    expect(remountedWrapper.find('[data-testid="onboarding-steps"]').exists()).toBe(false);
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
