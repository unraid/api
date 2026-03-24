import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  InternalBootApplyMessages,
  InternalBootApplyResult,
  InternalBootSelection,
} from '~/components/Onboarding/composables/internalBoot';

import OnboardingInternalBootStandalone from '~/components/Onboarding/standalone/OnboardingInternalBoot.standalone.vue';
import { createTestI18n } from '../../utils/i18n';

const { draftStore, applyInternalBootSelectionMock, dialogPropsRef, stepPropsRef, stepperPropsRef } =
  vi.hoisted(() => {
    const store = {
      internalBootSelection: null as {
        poolName: string;
        slotCount: number;
        devices: string[];
        bootSizeMiB: number;
        updateBios: boolean;
      } | null,
      internalBootApplySucceeded: false,
      setInternalBootApplySucceeded: vi.fn((value: boolean) => {
        store.internalBootApplySucceeded = value;
      }),
    };

    return {
      draftStore: store,
      applyInternalBootSelectionMock:
        vi.fn<
          (
            selection: InternalBootSelection,
            messages: InternalBootApplyMessages
          ) => Promise<InternalBootApplyResult>
        >(),
      dialogPropsRef: { value: null as Record<string, unknown> | null },
      stepPropsRef: { value: null as Record<string, unknown> | null },
      stepperPropsRef: { value: null as Record<string, unknown> | null },
    };
  });

vi.mock('@unraid/ui', () => ({
  Dialog: {
    props: ['modelValue', 'showFooter', 'showCloseButton', 'size', 'class'],
    emits: ['update:modelValue'],
    setup(props: Record<string, unknown>) {
      dialogPropsRef.value = props;
      return { props };
    },
    template: `
      <div data-testid="dialog-stub">
        <button data-testid="dialog-dismiss" @click="$emit('update:modelValue', false)">Dismiss</button>
        <slot />
      </div>
    `,
  },
}));

vi.mock('@/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

vi.mock('@/components/Onboarding/composables/internalBoot', () => ({
  applyInternalBootSelection: applyInternalBootSelectionMock,
}));

vi.mock('@/components/Onboarding/components/OnboardingConsole.vue', () => ({
  default: {
    props: ['logs'],
    template: '<div data-testid="onboarding-console">{{ JSON.stringify(logs) }}</div>',
  },
}));

vi.mock('@/components/Onboarding/OnboardingSteps.vue', () => ({
  default: {
    props: ['steps', 'activeStepIndex', 'onStepClick'],
    setup(props: Record<string, unknown>) {
      stepperPropsRef.value = props;
      return { props };
    },
    template: `
      <div data-testid="onboarding-steps-stub">
        {{ props.activeStepIndex }}
      </div>
    `,
  },
}));

vi.mock('@/components/Onboarding/steps/OnboardingInternalBootStep.vue', () => ({
  default: {
    props: ['onComplete', 'showBack', 'showSkip', 'isSavingStep'],
    setup(props: Record<string, unknown>) {
      stepPropsRef.value = props;
      return { props };
    },
    template: `
      <div data-testid="internal-boot-step-stub">
        <button data-testid="internal-boot-step-complete" @click="props.onComplete()">Complete</button>
      </div>
    `,
  },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowPathIcon: { template: '<span data-testid="arrow-path-icon" />' },
  CheckCircleIcon: { template: '<span data-testid="check-circle-icon" />' },
  ExclamationTriangleIcon: { template: '<span data-testid="warning-icon" />' },
  XMarkIcon: { template: '<span data-testid="close-icon" />' },
}));

const mountComponent = () =>
  mount(OnboardingInternalBootStandalone, {
    global: {
      plugins: [createTestI18n()],
    },
  });

describe('OnboardingInternalBoot.standalone.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    draftStore.internalBootSelection = null;
    draftStore.internalBootApplySucceeded = false;
    dialogPropsRef.value = null;
    stepPropsRef.value = null;
    stepperPropsRef.value = null;
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [],
    });
  });

  it('renders only the internal boot pane in editing mode', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="dialog-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-step-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-steps-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-console"]').exists()).toBe(false);
    expect(dialogPropsRef.value).toMatchObject({
      modelValue: true,
      showFooter: false,
      showCloseButton: false,
      size: 'full',
    });
    expect(stepPropsRef.value).toMatchObject({
      showBack: false,
      showSkip: false,
      isSavingStep: false,
    });
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 0,
      steps: [
        { id: 'CONFIGURE_BOOT', required: true },
        { id: 'SUMMARY', required: true },
      ],
    });
  });

  it('treats no selection as a no-op success without calling apply helper', async () => {
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="internal-boot-step-complete"]').trigger('click');
    await flushPromises();

    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();
    expect(draftStore.setInternalBootApplySucceeded).toHaveBeenCalledWith(false);
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.text()).toContain('No settings changed. Skipping configuration mutations.');
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 1,
    });
  });

  it('applies the selected internal boot configuration and records success', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: true,
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [
        {
          message: 'Internal boot pool configured.',
          type: 'success',
        },
      ],
    });

    const wrapper = mountComponent();

    await wrapper.get('[data-testid="internal-boot-step-complete"]').trigger('click');
    await flushPromises();

    expect(applyInternalBootSelectionMock).toHaveBeenCalledWith(
      {
        poolName: 'cache',
        devices: ['DISK-A'],
        bootSizeMiB: 16384,
        updateBios: true,
        slotCount: 1,
      },
      {
        configured: 'Internal boot pool configured.',
        returnedError: expect.any(Function),
        failed: 'Internal boot setup failed',
        biosUnverified: expect.any(String),
      }
    );
    expect(draftStore.setInternalBootApplySucceeded).toHaveBeenNthCalledWith(1, false);
    expect(draftStore.setInternalBootApplySucceeded).toHaveBeenNthCalledWith(2, true);
    expect(wrapper.find('[data-testid="onboarding-console"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Internal boot pool configured.');
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.find('[data-testid="internal-boot-standalone-edit-again"]').exists()).toBe(false);
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 1,
    });
  });

  it('shows retry affordance when the apply helper returns a failure result', async () => {
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: false,
      hadWarnings: true,
      hadNonOptimisticFailures: true,
      logs: [
        {
          message: 'Internal boot setup returned an error: mkbootpool failed',
          type: 'error',
        },
      ],
    });

    const wrapper = mountComponent();

    await wrapper.get('[data-testid="internal-boot-step-complete"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Setup Failed');
    expect(wrapper.text()).toContain('Internal boot setup returned an error: mkbootpool failed');
    expect(wrapper.find('[data-testid="internal-boot-standalone-edit-again"]').exists()).toBe(true);

    await wrapper.get('[data-testid="internal-boot-standalone-edit-again"]').trigger('click');
    await flushPromises();

    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 0,
    });
    expect(wrapper.find('[data-testid="internal-boot-step-stub"]').exists()).toBe(true);
  });

  it('closes locally after showing a result', async () => {
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="internal-boot-step-complete"]').trigger('click');
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-standalone-result-close"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-standalone-result"]').exists()).toBe(false);
  });

  it('closes when the shared dialog requests dismissal', async () => {
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="dialog-dismiss"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-stub"]').exists()).toBe(false);
  });
});
