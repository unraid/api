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
    sessionSource: { value: 'automatic' as 'automatic' | 'manual' },
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
    internalBootApplyAttempted: { value: false },
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
    OVERVIEW: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="overview-step"><button data-testid="overview-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="overview-step-back" @click="onBack()">back</button></div>',
    },
    CONFIGURE_SETTINGS: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="settings-step"><button data-testid="settings-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="settings-step-back" @click="onBack()">back</button></div>',
    },
    CONFIGURE_BOOT: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="internal-boot-step"><button data-testid="internal-boot-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="internal-boot-step-back" @click="onBack()">back</button></div>',
    },
    ADD_PLUGINS: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="plugins-step"><button data-testid="plugins-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="plugins-step-back" @click="onBack()">back</button></div>',
    },
    ACTIVATE_LICENSE: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="license-step"><button data-testid="license-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="license-step-back" @click="onBack()">back</button></div>',
    },
    SUMMARY: {
      props: ['onComplete', 'onBack', 'showBack'],
      template:
        '<div data-testid="summary-step"><button data-testid="summary-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="summary-step-back" @click="onBack()">back</button></div>',
    },
    NEXT_STEPS: {
      props: ['onComplete', 'onBack', 'showBack'],
      setup(props: { onComplete: () => void; onBack?: () => void; showBack?: boolean }) {
        const handleClick = () => {
          cleanupOnboardingStorageMock();
          props.onComplete();
        };

        return {
          handleClick,
          props,
        };
      },
      template:
        '<div data-testid="next-step"><button data-testid="next-step-complete" @click="handleClick">finish</button><button v-if="props.showBack" data-testid="next-step-back" @click="props.onBack?.()">back</button></div>',
    },
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
      onboardingModalStoreState.sessionSource.value = 'automatic';
      return true;
    });

    activationCodeDataStore.loading = ref(false);
    activationCodeDataStore.activationRequired = ref(false);
    activationCodeDataStore.hasActivationCode = ref(true);
    activationCodeDataStore.registrationState = ref<string | null>('ENOKEYFILE');
    onboardingModalStoreState.isVisible.value = true;
    onboardingModalStoreState.sessionSource.value = 'automatic';
    activationCodeDataStore.registrationState.value = 'ENOKEYFILE';
    onboardingStatusStore.isVersionDrift.value = false;
    onboardingStatusStore.completedAtVersion.value = null;
    onboardingStatusStore.canDisplayOnboardingModal.value = true;
    onboardingStatusStore.isPartnerBuild.value = false;
    onboardingDraftStore.currentStepId.value = null;
    onboardingDraftStore.internalBootApplySucceeded.value = false;
    onboardingDraftStore.internalBootApplyAttempted.value = false;
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

  it('keeps the internal boot step visible even when the server reports prior internal boot setup', () => {
    internalBootVisibilityResult.value = {
      bootedFromFlashWithInternalBootSetup: true,
      enableBootTransfer: 'yes',
    };
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_BOOT';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="internal-boot-step"]').exists()).toBe(true);
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

  it('closes the modal from next steps after draft cleanup instead of persisting step 2 again', async () => {
    onboardingDraftStore.currentStepId.value = 'NEXT_STEPS';
    cleanupOnboardingStorageMock.mockImplementation(() => {
      onboardingDraftStore.currentStepId.value = null;
    });

    const wrapper = mountComponent();

    await wrapper.find('[data-testid="next-step-complete"]').trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledTimes(1);
    expect(onboardingDraftStore.setCurrentStep).not.toHaveBeenCalledWith('CONFIGURE_SETTINGS');
    expect(onboardingDraftStore.currentStepId.value).toBeNull();
  });

  it('reloads the page when completing a manually opened wizard', async () => {
    onboardingModalStoreState.sessionSource.value = 'manual';
    onboardingDraftStore.currentStepId.value = 'NEXT_STEPS';
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="next-step-complete"]').trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while exit confirmation is closing the modal', async () => {
    let closeModalDeferred:
      | {
          promise: Promise<boolean>;
          resolve: (value: boolean) => void;
        }
      | undefined;
    onboardingModalStoreState.closeModal.mockImplementation(() => {
      let resolve!: (value: boolean) => void;
      const promise = new Promise<boolean>((innerResolve) => {
        resolve = innerResolve;
      });
      closeModalDeferred = { promise, resolve };
      return promise;
    });

    const wrapper = mountComponent();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    const exitButton = wrapper.findAll('button').find((button) => button.text().includes('Exit setup'));
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Closing setup...');

    if (closeModalDeferred) {
      closeModalDeferred.resolve(true);
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

  it('hides the X button when internal boot lockdown is active', () => {
    onboardingDraftStore.internalBootApplyAttempted.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('button[aria-label="Close onboarding"]').exists()).toBe(false);
  });

  it('passes showBack=false to step components when internal boot lockdown is active', async () => {
    onboardingDraftStore.internalBootApplyAttempted.value = true;
    onboardingDraftStore.currentStepId.value = 'CONFIGURE_SETTINGS';

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="settings-step-back"]').exists()).toBe(false);
  });

  it('does not open exit confirmation when locked and X area is somehow triggered', async () => {
    onboardingDraftStore.internalBootApplyAttempted.value = true;

    const wrapper = mountComponent();

    expect(wrapper.find('button[aria-label="Close onboarding"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Exit onboarding?');
  });
});
