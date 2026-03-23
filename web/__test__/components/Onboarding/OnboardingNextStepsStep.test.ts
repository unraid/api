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
  cleanupOnboardingStorageMock,
  completeOnboardingMock,
  refetchOnboardingMock,
  useMutationMock,
} = vi.hoisted(() => ({
  draftStore: {
    internalBootApplySucceeded: false,
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

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => reactive(draftStore),
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
});
