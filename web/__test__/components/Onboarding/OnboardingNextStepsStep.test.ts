import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPLETE_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/completeUpgradeStep.mutation';
import OnboardingNextStepsStep from '~/components/Onboarding/steps/OnboardingNextStepsStep.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  draftStore,
  activationCodeDataStore,
  submitInternalBootRebootMock,
  submitInternalBootShutdownMock,
  cleanupOnboardingStorageMock,
  completeOnboardingMock,
  refetchOnboardingMock,
  useMutationMock,
} = vi.hoisted(() => ({
  draftStore: {
    internalBootApplySucceeded: false,
    internalBootApplyAttempted: false,
    internalBootSelection: null as {
      poolName: string;
      slotCount: number;
      devices: string[];
      bootSizeMiB: number;
      updateBios: boolean;
      poolMode: 'dedicated' | 'hybrid';
    } | null,
  },
  activationCodeDataStore: {
    partnerInfo: {
      value: {
        partner: {
          manualUrl: null,
          hardwareSpecsUrl: null,
          supportUrl: null,
          extraLinks: [],
        },
      },
    },
    activationCode: {
      value: null,
    },
  },
  submitInternalBootRebootMock: vi.fn(),
  submitInternalBootShutdownMock: vi.fn(),
  cleanupOnboardingStorageMock: vi.fn(),
  completeOnboardingMock: vi.fn().mockResolvedValue({}),
  refetchOnboardingMock: vi.fn().mockResolvedValue({}),
  useMutationMock: vi.fn(),
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
  },
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => reactive(activationCodeDataStore),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: () => ({
    refetchOnboarding: refetchOnboardingMock,
  }),
}));

vi.mock('~/components/Onboarding/composables/internalBoot', () => ({
  submitInternalBootReboot: submitInternalBootRebootMock,
  submitInternalBootShutdown: submitInternalBootShutdownMock,
}));

vi.mock('~/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: cleanupOnboardingStorageMock,
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useMutation: useMutationMock,
  };
});

describe('OnboardingNextStepsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    draftStore.internalBootApplySucceeded = false;
    draftStore.internalBootApplyAttempted = false;
    draftStore.internalBootSelection = null;
    completeOnboardingMock.mockResolvedValue({});
    refetchOnboardingMock.mockResolvedValue({});
    useMutationMock.mockImplementation((doc: unknown) => {
      if (doc === COMPLETE_ONBOARDING_MUTATION) {
        return { mutate: completeOnboardingMock };
      }
      return { mutate: vi.fn() };
    });
  });

  const mountComponent = () => {
    const onComplete = vi.fn();
    const wrapper = mount(OnboardingNextStepsStep, {
      props: {
        draft: {
          internalBoot: {
            bootMode: draftStore.internalBootSelection ? 'storage' : 'usb',
            skipped: draftStore.internalBootSelection === null,
            selection: draftStore.internalBootSelection,
          },
        },
        internalBootState: {
          applyAttempted: draftStore.internalBootApplyAttempted,
          applySucceeded: draftStore.internalBootApplySucceeded,
        },
        onComplete,
        showBack: true,
      },
      global: {
        plugins: [createTestI18n()],
        stubs: {
          UAlert: {
            props: ['description'],
            template: '<div>{{ description }}<slot name="description" /></div>',
          },
          UButton: {
            props: ['disabled'],
            emits: ['click'],
            template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
          },
          UModal: {
            props: ['open', 'title', 'description'],
            template: `
              <div v-if="open" data-testid="dialog">
                <div>{{ title }}</div>
                <div>{{ description }}</div>
                <slot name="body" />
                <slot name="footer" />
              </div>
            `,
          },
          InternalBootConfirmDialog: {
            props: ['open', 'action', 'disabled'],
            emits: ['confirm', 'cancel'],
            template: `
              <div v-if="open" data-testid="power-dialog">
                <div>{{ action === 'shutdown' ? 'Confirm Shutdown' : 'Confirm Reboot' }}</div>
                <div>Please do NOT remove your Unraid flash drive</div>
                <button :disabled="disabled" @click="$emit('confirm')">I Understand</button>
                <button :disabled="disabled" @click="$emit('cancel')">Cancel</button>
              </div>
            `,
          },
        },
      },
    });

    return { wrapper, onComplete };
  };

  it('continues to dashboard through the shared completion path when reboot is not required', async () => {
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
    expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
  });

  it('marks onboarding complete through the same path before rebooting', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplySucceeded = true;
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Confirm Reboot');
    expect(wrapper.text()).toContain('Please do NOT remove your Unraid flash drive');
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();

    const confirmButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'I Understand');
    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
    expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(submitInternalBootRebootMock).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('continues when the completion refresh fails after marking onboarding complete', async () => {
    refetchOnboardingMock.mockRejectedValueOnce(new Error('refresh failed'));
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
    expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows an error and stays on the page when completion fails', async () => {
    completeOnboardingMock.mockRejectedValueOnce(new Error('offline'));
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(cleanupOnboardingStorageMock).not.toHaveBeenCalled();
    expect(refetchOnboardingMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
  });

  it('shows reboot button when internalBootSelection is non-null but apply did not succeed', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplySucceeded = false;
    const { wrapper } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    expect(button.text()).toContain('Reboot');
  });

  it('shows failure alert when internal boot failed', () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplyAttempted = true;
    draftStore.internalBootApplySucceeded = false;
    const { wrapper } = mountComponent();

    expect(wrapper.text()).toContain('Internal boot timed out');
  });

  it('shows BIOS warning when internal boot failed and updateBios was requested', () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplyAttempted = true;
    draftStore.internalBootApplySucceeded = false;
    const { wrapper } = mountComponent();

    expect(wrapper.text()).toContain('BIOS boot order update could not be applied');
  });

  it('proceeds to reboot even when completeOnboarding throws', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplySucceeded = true;
    completeOnboardingMock.mockRejectedValueOnce(new Error('offline'));
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    const confirmButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'I Understand');
    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(submitInternalBootRebootMock).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows shutdown button when internal boot is configured', () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    const { wrapper } = mountComponent();

    expect(wrapper.text()).toContain('Shutdown');
  });

  it('does not show shutdown button when no internal boot selection', () => {
    const { wrapper } = mountComponent();

    expect(wrapper.text()).not.toContain('Shutdown');
  });

  it('shuts down the server through confirmation dialog', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };
    draftStore.internalBootApplySucceeded = true;
    const { wrapper, onComplete } = mountComponent();

    const shutdownButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'Shutdown');
    expect(shutdownButton).toBeTruthy();
    await shutdownButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Confirm Shutdown');

    const confirmButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'I Understand');
    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(submitInternalBootShutdownMock).toHaveBeenCalledTimes(1);
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('proceeds to shutdown even when completeOnboarding throws', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    completeOnboardingMock.mockRejectedValueOnce(new Error('offline'));
    const { wrapper, onComplete } = mountComponent();

    const shutdownButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'Shutdown');
    await shutdownButton!.trigger('click');
    await flushPromises();

    const confirmButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().trim() === 'I Understand');
    await confirmButton!.trigger('click');
    await flushPromises();

    expect(cleanupOnboardingStorageMock).toHaveBeenCalledWith();
    expect(submitInternalBootShutdownMock).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
