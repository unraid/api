import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  InternalBootApplyMessages,
  InternalBootApplyResult,
  InternalBootSelection,
} from '~/components/Onboarding/composables/internalBoot';
import type { OnboardingInternalBootDraft } from '~/components/Onboarding/onboardingWizardState';

import OnboardingInternalBootStandalone from '~/components/Onboarding/standalone/OnboardingInternalBoot.standalone.vue';
import { createTestI18n } from '../../utils/i18n';

const INTERNAL_BOOT_HISTORY_STATE_KEY = '__unraidOnboardingInternalBoot';

const createBootDevice = (id: string, sizeBytes: number, deviceName: string) => ({
  id,
  sizeBytes,
  deviceName,
});

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
};

type InternalBootHistoryState = {
  sessionId: string;
  stepId: 'CONFIGURE_BOOT' | 'SUMMARY';
  position: number;
};

const {
  configureDraftState,
  applyInternalBootSelectionMock,
  submitInternalBootRebootMock,
  submitInternalBootShutdownMock,
  cleanupOnboardingStorageMock,
  dialogPropsRef,
  internalBootConfirmDialogPropsRef,
  stepPropsRef,
  stepperPropsRef,
} = vi.hoisted(() => ({
  configureDraftState: {
    value: {
      bootMode: 'usb',
      skipped: true,
      selection: null,
    } as OnboardingInternalBootDraft,
  },
  submitInternalBootRebootMock: vi.fn(),
  submitInternalBootShutdownMock: vi.fn(),
  applyInternalBootSelectionMock:
    vi.fn<
      (
        selection: InternalBootSelection,
        messages: InternalBootApplyMessages
      ) => Promise<InternalBootApplyResult>
    >(),
  cleanupOnboardingStorageMock: vi.fn(),
  dialogPropsRef: { value: null as Record<string, unknown> | null },
  internalBootConfirmDialogPropsRef: { value: null as Record<string, unknown> | null },
  stepPropsRef: { value: null as Record<string, unknown> | null },
  stepperPropsRef: { value: null as Record<string, unknown> | null },
}));

vi.mock('@unraid/ui', () => ({
  Dialog: {
    props: ['modelValue', 'showFooter', 'showCloseButton', 'size', 'class'],
    emits: ['update:modelValue'],
    setup(props: Record<string, unknown>) {
      dialogPropsRef.value = props;
      return { props };
    },
    template: `
      <div v-if="modelValue" data-testid="dialog-stub">
        <button data-testid="dialog-dismiss" @click="$emit('update:modelValue', false)">Dismiss</button>
        <slot />
      </div>
    `,
  },
}));

vi.mock('@/components/Onboarding/composables/internalBoot', () => ({
  applyInternalBootSelection: applyInternalBootSelectionMock,
  submitInternalBootReboot: submitInternalBootRebootMock,
  submitInternalBootShutdown: submitInternalBootShutdownMock,
}));

vi.mock('@/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: cleanupOnboardingStorageMock,
}));

vi.mock('@/components/Onboarding/components/OnboardingConsole.vue', () => ({
  default: {
    props: ['logs'],
    template: '<div data-testid="onboarding-console">{{ JSON.stringify(logs) }}</div>',
  },
}));

vi.mock('@/components/Onboarding/components/InternalBootConfirmDialog.vue', () => ({
  default: {
    props: ['open', 'action', 'disabled'],
    emits: ['confirm', 'cancel'],
    setup(props: Record<string, unknown>) {
      internalBootConfirmDialogPropsRef.value = props;
      return { props };
    },
    template: `
      <div v-if="open" data-testid="internal-boot-confirm-dialog-stub">
        <div data-testid="internal-boot-confirm-dialog-action">{{ props.action }}</div>
        <button data-testid="internal-boot-confirm-dialog-confirm" @click="$emit('confirm')">
          Confirm
        </button>
        <button data-testid="internal-boot-confirm-dialog-cancel" @click="$emit('cancel')">
          Cancel
        </button>
      </div>
    `,
  },
}));

vi.mock('@/components/Onboarding/OnboardingSteps.vue', () => ({
  default: {
    props: ['steps', 'activeStepIndex', 'onStepClick'],
    setup(props: Record<string, unknown>) {
      stepperPropsRef.value = props;
      return { props };
    },
    template: '<div data-testid="onboarding-steps-stub">{{ props.activeStepIndex }}</div>',
  },
}));

vi.mock('@/components/Onboarding/steps/OnboardingInternalBootStep.vue', () => ({
  default: {
    props: ['initialDraft', 'onComplete', 'onBack', 'showBack', 'showSkip', 'isSavingStep'],
    setup(props: Record<string, unknown>) {
      const cloneDraft = () => {
        const initialDraft = configureDraftState.value;
        return {
          bootMode: initialDraft?.bootMode ?? 'usb',
          skipped: initialDraft?.skipped ?? true,
          selection:
            initialDraft?.selection === undefined
              ? undefined
              : initialDraft.selection === null
                ? null
                : {
                    ...initialDraft.selection,
                    devices: (initialDraft.selection.devices ?? []).map((device) => ({ ...device })),
                  },
        };
      };
      stepPropsRef.value = props;
      return { props, cloneDraft };
    },
    template: `
      <div data-testid="internal-boot-step-stub">
        <button
          data-testid="internal-boot-step-complete"
          @click="props.onComplete(cloneDraft())"
        >
          Complete
        </button>
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

enableAutoUnmount(afterEach);

const getInternalBootHistoryState = (): InternalBootHistoryState | null => {
  const state =
    typeof window.history.state === 'object' && window.history.state !== null
      ? (window.history.state as Record<string, unknown>)
      : null;
  const candidate = state?.[INTERNAL_BOOT_HISTORY_STATE_KEY];
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const sessionId =
    typeof (candidate as Record<string, unknown>).sessionId === 'string'
      ? ((candidate as Record<string, unknown>).sessionId as string)
      : null;
  const stepId =
    (candidate as Record<string, unknown>).stepId === 'CONFIGURE_BOOT' ||
    (candidate as Record<string, unknown>).stepId === 'SUMMARY'
      ? ((candidate as Record<string, unknown>).stepId as InternalBootHistoryState['stepId'])
      : null;
  const position = Number((candidate as Record<string, unknown>).position);

  if (!sessionId || !stepId || !Number.isInteger(position)) {
    return null;
  }

  return {
    sessionId,
    stepId,
    position,
  };
};

const dispatchPopstate = (state: Record<string, unknown> | null) => {
  window.history.replaceState(state, '', window.location.href);
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
};

const findButtonByText = (wrapper: ReturnType<typeof mountComponent>, text: string) =>
  wrapper
    .findAll('button')
    .find((button) => button.text().trim().toLowerCase() === text.trim().toLowerCase());

const advanceToSummary = async (wrapper: ReturnType<typeof mountComponent>) => {
  await wrapper.get('[data-testid="internal-boot-step-complete"]').trigger('click');
  await flushPromises();
};

const confirmAndApply = async (wrapper: ReturnType<typeof mountComponent>) => {
  const confirmButton = findButtonByText(wrapper, 'Confirm & Apply');
  expect(confirmButton).toBeTruthy();
  await confirmButton!.trigger('click');
  await flushPromises();
};

describe('OnboardingInternalBoot.standalone.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', window.location.href);

    configureDraftState.value = {
      bootMode: 'usb',
      skipped: true,
      selection: null,
    };
    dialogPropsRef.value = null;
    internalBootConfirmDialogPropsRef.value = null;
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
      initialDraft: configureDraftState.value,
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

    await advanceToSummary(wrapper);

    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(false);
    await confirmAndApply(wrapper);

    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('No Updates Needed');
    expect(wrapper.text()).toContain('No changes needed. Skipping configuration updates.');
    expect(wrapper.find('[data-testid="internal-boot-standalone-edit-again"]').exists()).toBe(true);
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 1,
    });
  });

  it('ignores stale storage selection data when the current draft is usb', async () => {
    configureDraftState.value = {
      bootMode: 'usb',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('No Updates Needed');
  });

  it('applies the selected internal boot configuration and records success', async () => {
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [{ message: 'Internal boot pool configured.', type: 'success' }],
    });

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);

    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Boot Configuration');
    expect(wrapper.text()).toContain('Storage Drive(s)');
    expect(wrapper.text()).toContain('DISK-A - 537 GB (sda)');
    await confirmAndApply(wrapper);

    expect(applyInternalBootSelectionMock).toHaveBeenCalledWith(
      {
        poolName: 'cache',
        devices: ['DISK-A'],
        bootSizeMiB: 16384,
        updateBios: true,
        slotCount: 1,
        poolMode: 'hybrid',
      },
      {
        configured: 'Internal boot pool configured.',
        returnedError: expect.any(Function),
        failed: 'Internal boot setup failed',
        biosUnverified: expect.any(String),
      }
    );
    expect(wrapper.find('[data-testid="onboarding-console"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Internal boot pool configured.');
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.find('[data-testid="internal-boot-standalone-edit-again"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-reboot"]').exists()).toBe(true);
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 1,
    });
  });

  it('shows an editable error state when the standalone boot summary is invalid', async () => {
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: '',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-summary-invalid"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Your boot configuration is incomplete.');
    expect(findButtonByText(wrapper, 'Confirm & Apply')).toBeFalsy();

    await findButtonByText(wrapper, 'Back')!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-step-stub"]').exists()).toBe(true);
    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 0,
    });
  });

  it('shows a locked failure result with reboot controls when apply fails', async () => {
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: false,
        poolMode: 'hybrid',
      },
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: false,
      hadWarnings: true,
      hadNonOptimisticFailures: true,
      logs: [{ message: 'Internal boot setup returned an error: mkbootpool failed', type: 'error' }],
    });

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    expect(wrapper.text()).toContain('Setup Failed');
    expect(wrapper.text()).toContain('Internal boot setup returned an error: mkbootpool failed');
    expect(wrapper.find('[data-testid="internal-boot-standalone-edit-again"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-reboot"]').exists()).toBe(true);
  });

  it('restores the configure step when browser back leaves a reversible result', async () => {
    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    const currentHistoryState = getInternalBootHistoryState();
    expect(currentHistoryState).toMatchObject({
      stepId: 'SUMMARY',
      position: 1,
    });

    dispatchPopstate({
      [INTERNAL_BOOT_HISTORY_STATE_KEY]: {
        sessionId: currentHistoryState?.sessionId,
        stepId: 'CONFIGURE_BOOT',
        position: 0,
      },
    });
    await flushPromises();

    expect(stepperPropsRef.value).toMatchObject({
      activeStepIndex: 0,
    });
    expect(wrapper.find('[data-testid="internal-boot-step-stub"]').exists()).toBe(true);
  });

  it('blocks browser back navigation when locked after a fully applied result', async () => {
    const forwardSpy = vi.spyOn(window.history, 'forward').mockImplementation(() => {});
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    const currentHistoryState = getInternalBootHistoryState();
    expect(currentHistoryState).toMatchObject({
      stepId: 'SUMMARY',
      position: 1,
    });

    dispatchPopstate({
      [INTERNAL_BOOT_HISTORY_STATE_KEY]: {
        sessionId: currentHistoryState?.sessionId,
        stepId: 'CONFIGURE_BOOT',
        position: 0,
      },
    });
    await flushPromises();

    expect(forwardSpy).toHaveBeenCalled();
    expect(cleanupOnboardingStorageMock).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="dialog-stub"]').exists()).toBe(true);
  });

  it('closes locally after showing a reversible result', async () => {
    const historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    await wrapper.get('[data-testid="internal-boot-standalone-result-close"]').trigger('click');
    await flushPromises();

    expect(historyGoSpy).toHaveBeenCalledWith(-2);
    dispatchPopstate(null);
    await flushPromises();

    expect(cleanupOnboardingStorageMock).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="dialog-stub"]').exists()).toBe(false);
  });

  it('closes via the top-right X button in edit mode', async () => {
    const historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="internal-boot-standalone-close"]').trigger('click');
    await flushPromises();

    expect(historyGoSpy).toHaveBeenCalledWith(-1);
    dispatchPopstate(null);
    await flushPromises();

    expect(cleanupOnboardingStorageMock).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="dialog-stub"]').exists()).toBe(false);
  });

  it('shows reboot and shutdown actions when the result is locked', async () => {
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    expect(wrapper.find('[data-testid="internal-boot-standalone-close"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-result-close"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-reboot"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-standalone-shutdown"]').exists()).toBe(true);
  });

  it('hides all summary actions while internal boot apply is still running', async () => {
    const deferred = createDeferred<InternalBootApplyResult>();
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: true,
        poolMode: 'hybrid',
      },
    };
    applyInternalBootSelectionMock.mockReturnValueOnce(deferred.promise);

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    const confirmButton = findButtonByText(wrapper, 'Confirm & Apply');
    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-standalone-close"]').exists()).toBe(false);
    expect(findButtonByText(wrapper, 'Back')).toBeFalsy();
    expect(findButtonByText(wrapper, 'Confirm & Apply')).toBeFalsy();
    expect(wrapper.find('[data-testid="internal-boot-standalone-reboot"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-shutdown"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="internal-boot-standalone-result-close"]').exists()).toBe(false);

    deferred.resolve({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [{ message: 'Internal boot pool configured.', type: 'success' }],
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-standalone-reboot"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-standalone-shutdown"]').exists()).toBe(true);
  });

  it('routes locked-result reboot and shutdown actions through the shared confirm dialog', async () => {
    configureDraftState.value = {
      bootMode: 'storage',
      skipped: false,
      selection: {
        poolName: 'cache',
        slotCount: 1,
        devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
        bootSizeMiB: 16384,
        updateBios: false,
        poolMode: 'hybrid',
      },
    };

    const wrapper = mountComponent();

    await advanceToSummary(wrapper);
    await confirmAndApply(wrapper);

    await wrapper.get('[data-testid="internal-boot-standalone-reboot"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="internal-boot-confirm-dialog-stub"]').exists()).toBe(true);
    expect(internalBootConfirmDialogPropsRef.value).toMatchObject({
      open: true,
      action: 'reboot',
    });
    expect(submitInternalBootRebootMock).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="internal-boot-confirm-dialog-confirm"]').trigger('click');
    await flushPromises();
    expect(submitInternalBootRebootMock).toHaveBeenCalledTimes(1);

    await wrapper.get('[data-testid="internal-boot-standalone-shutdown"]').trigger('click');
    await flushPromises();
    expect(internalBootConfirmDialogPropsRef.value).toMatchObject({
      open: true,
      action: 'shutdown',
    });
    expect(submitInternalBootShutdownMock).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="internal-boot-confirm-dialog-confirm"]').trigger('click');
    await flushPromises();
    expect(submitInternalBootShutdownMock).toHaveBeenCalledTimes(1);
  });
});
