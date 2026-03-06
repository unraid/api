import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingNextStepsStep from '~/components/Onboarding/steps/OnboardingNextStepsStep.vue';
import { createTestI18n } from '../../utils/i18n';

const { draftStore, activationCodeDataStore, submitInternalBootRebootMock } = vi.hoisted(() => ({
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
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
  },
  Dialog: {
    props: ['modelValue'],
    template: '<div v-if="modelValue" data-testid="dialog"><slot /></div>',
  },
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => reactive(draftStore),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => reactive(activationCodeDataStore),
}));

vi.mock('~/components/Onboarding/composables/internalBoot', () => ({
  submitInternalBootReboot: submitInternalBootRebootMock,
}));

describe('OnboardingNextStepsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftStore.internalBootApplySucceeded = false;
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
      },
    });

    return { wrapper, onComplete };
  };

  it('continues to dashboard when reboot is not required', async () => {
    const { wrapper, onComplete } = mountComponent();

    const button = wrapper.find('[data-testid="brand-button"]');
    await button.trigger('click');
    await flushPromises();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
  });

  it('shows reboot warning dialog and waits for confirmation', async () => {
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

    expect(submitInternalBootRebootMock).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
