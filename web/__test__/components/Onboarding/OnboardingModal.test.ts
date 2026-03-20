import { ref } from 'vue';
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
  internalBootVisibilityResult: {
    value: {
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'yes',
    },
  } as InternalBootVisibilityResult,
  internalBootVisibilityLoading: { value: false },
  onboardingModalStoreState: {
    isVisible: { value: true },
    closeModal: vi.fn().mockResolvedValue(true),
  },
  activationCodeDataStore: {
    loading: { value: false },
    activationRequired: { value: false },
    hasActivationCode: { value: true },
    registrationState: { value: 'ENOKEYFILE' as string | null },
    partnerInfo: {
      value: {
        partner: { name: null, url: null },
        branding: { hasPartnerLogo: false },
      },
    },
  },
  onboardingStatusStore: {
    isVersionDrift: { value: false },
    completedAtVersion: { value: null as string | null },
    canDisplayOnboardingModal: { value: true },
    isPartnerBuild: { value: false },
    refetchOnboarding: vi.fn().mockResolvedValue(undefined),
  },
  onboardingDraftStore: {
    currentStepId: { value: null as StepId | null },
    internalBootApplySucceeded: { value: false },
    setCurrentStep: vi.fn((stepId: StepId) => {
      onboardingDraftStore.currentStepId.value = stepId;
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
  Spinner: {
    name: 'Spinner',
    template: '<div data-testid="loading-spinner" />',
  },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: { template: '<svg />' },
  XMarkIcon: { template: '<svg />' },
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

    onboardingModalStoreState.closeModal.mockImplementation(async () => {
      onboardingModalStoreState.isVisible.value = false;
      return true;
    });

    activationCodeDataStore.loading = ref(false);
    activationCodeDataStore.activationRequired = ref(false);
    activationCodeDataStore.hasActivationCode = ref(true);
    activationCodeDataStore.registrationState = ref<string | null>('ENOKEYFILE');
    onboardingModalStoreState.isVisible.value = true;
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    onboardingStatusStore.isVersionDrift.value = false;
    onboardingStatusStore.completedAtVersion.value = null;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;
    onboardingStatusStore.isPartnerBuild.value = false;
    onboardingDraftStore.currentStepId.value = null;
    onboardingDraftStore.internalBootApplySucceeded.value = false;
    internalBootVisibilityLoading.value = false;
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'yes',
    };
  });

  const mountComponent = () =>
    mount(OnboardingModal, {
      global: {
        plugins: [createTestI18n()],
      },
    });

  it.each([
    ['OVERVIEW', 'overview-step'],
    ['CONFIGURE_SETTINGS', 'settings-step'],
    ['CONFIGURE_BOOT', 'internal-boot-step'],
    ['ADD_PLUGINS', 'plugins-step'],
    ['ACTIVATE_LICENSE', 'license-step'],
    ['SUMMARY', 'summary-step'],
    ['NEXT_STEPS', 'next-step'],
  ] as const)('resumes persisted step %s when it is available', (stepId, testId) => {
    onboardingDraftStore.currentStepId.value = stepId;

    const wrapper = mountComponent();

    expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(true);
  });

  it('renders when backend visibility is enabled', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-steps"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="overview-step"]').exists()).toBe(true);
  });

  it('does not render when backend visibility is disabled', () => {
    onboardingModalStoreState.isVisible.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('does not render when modal display is blocked', () => {
    onboardingStatusStore.canDisplayOnboardingModal.value = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('shows the activation step for ENOKEYFILE1', () => {
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE1';
    onboardingDraftStore.currentStepId.value = 'ACTIVATE_LICENSE';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
  });

  it('hides the internal boot step when boot transfer is unavailable', () => {
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'no',
    };
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('keeps a resumed activation step visible while activation state is still loading', async () => {
    activationCodeDataStore.loading.value = true;
    activationCodeDataStore.hasActivationCode.value = false;
    activationCodeDataStore.registrationState.value = null;
    onboardingDraftStore.currentStepId.value = 'ACTIVATE_LICENSE';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
    expect(onboardingDraftStore.setCurrentStep).not.toHaveBeenCalledWith('SUMMARY');

    activationCodeDataStore.loading.value = false;
    activationCodeDataStore.hasActivationCode.value = true;
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    await flushPromises();

    expect(wrapper.find('[data-testid="license-step"]').exists()).toBe(true);
    expect(onboardingDraftStore.currentStepId.value).toBe('ACTIVATE_LICENSE');
  });

  it('opens exit confirmation when close button is clicked', async () => {
    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');

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

  it('closes onboarding through the backend-owned close path', async () => {
    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
  });

  it('shows a loading state while exit confirmation is closing the modal', async () => {
    let resolveCloseModal: ((value: boolean) => void) | null = null;
    onboardingModalStoreState.closeModal.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveCloseModal = resolve;
        })
    );

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Closing setup...');

    if (resolveCloseModal) {
      resolveCloseModal(true);
    }
    await flushPromises();
  });

  it('closes onboarding without frontend completion logic', async () => {
    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledTimes(1);
  });

  it('does not reopen upgrade onboarding just from descriptive status when backend visibility is closed', () => {
    onboardingModalStoreState.isVisible.value = false;
    onboardingStatusStore.isVersionDrift.value = true;
    onboardingStatusStore.completedAtVersion.value = '7.2.4';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });
});
