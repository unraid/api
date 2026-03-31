<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import { buildBootConfigurationSummaryViewModel } from '@/components/Onboarding/components/bootConfigurationSummary/buildBootConfigurationSummaryViewModel';
import OnboardingBootConfigurationSummary from '@/components/Onboarding/components/bootConfigurationSummary/OnboardingBootConfigurationSummary.vue';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import {
  applyInternalBootSelection,
  submitInternalBootReboot,
  submitInternalBootShutdown,
} from '@/components/Onboarding/composables/internalBoot';
import OnboardingSteps from '@/components/Onboarding/OnboardingSteps.vue';
import { createEmptyOnboardingWizardInternalBootState } from '@/components/Onboarding/onboardingWizardState';
import OnboardingInternalBootStep from '@/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import { cleanupOnboardingStorage } from '@/components/Onboarding/store/onboardingStorageCleanup';
import { convert } from 'convert';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';
import type {
  InternalBootApplyResult,
  InternalBootSelection,
} from '@/components/Onboarding/composables/internalBoot';
import type { OnboardingInternalBootDraft } from '@/components/Onboarding/onboardingWizardState';
import type { StepId } from '@/components/Onboarding/stepRegistry';

const { t } = useI18n();
const INTERNAL_BOOT_HISTORY_STATE_KEY = '__unraidOnboardingInternalBoot';

type InternalBootHistoryState = {
  sessionId: string;
  stepId: StepId;
  position: number;
};

const currentStep = ref<StepId>('CONFIGURE_BOOT');
const confirmationState = ref<'idle' | 'saving' | 'result'>('idle');
const isOpen = ref(true);
const logs = ref<LogEntry[]>([]);
const resultTitle = ref('');
const resultMessage = ref('');
const resultSeverity = ref<'success' | 'warning' | 'error'>('success');
const historySessionId = ref<string | null>(null);
const historyPosition = ref(-1);
const isApplyingHistoryState = ref(false);
const internalBootDraft = ref<OnboardingInternalBootDraft>({
  bootMode: 'usb',
  skipped: true,
  selection: null,
});
const internalBootState = ref(createEmptyOnboardingWizardInternalBootState());
const standaloneSteps: Array<{ id: StepId; required: boolean }> = [
  { id: 'CONFIGURE_BOOT', required: true },
  { id: 'SUMMARY', required: true },
];

const summaryT = (key: string, values?: Record<string, unknown>) =>
  t(`onboarding.summaryStep.${key}`, values ?? {});
const standaloneSummaryInvalidMessage =
  'Your boot configuration is incomplete. Go back and review the boot settings before applying changes.';

const isLocked = computed(() => internalBootState.value.applyAttempted);

const handlePowerAction = (action: 'reboot' | 'shutdown') => {
  cleanupOnboardingStorage();
  if (action === 'shutdown') {
    submitInternalBootShutdown();
  } else {
    submitInternalBootReboot();
  }
};

const canReturnToConfigure = () =>
  !isLocked.value &&
  confirmationState.value === 'result' &&
  (resultSeverity.value !== 'success' || !internalBootState.value.applySucceeded);

const showConsole = computed(() => confirmationState.value === 'saving' || logs.value.length > 0);
const isSaving = computed(() => confirmationState.value === 'saving');
const canEditAgain = computed(() => currentStep.value === 'SUMMARY' && canReturnToConfigure());
const formatDeviceSize = (sizeBytes: number) => {
  const converted = convert(sizeBytes, 'B').to('best', 'metric');
  const precision = converted.quantity >= 100 || converted.unit === 'B' ? 0 : 1;
  return `${converted.quantity.toFixed(precision)} ${converted.unit}`;
};
const bootConfigurationSummaryState = computed(() =>
  buildBootConfigurationSummaryViewModel(internalBootDraft.value, {
    labels: {
      title: summaryT('bootConfig.title'),
      bootMethod: summaryT('bootConfig.bootMethod'),
      bootMethodStorage: summaryT('bootConfig.bootMethodStorage'),
      bootMethodUsb: summaryT('bootConfig.bootMethodUsb'),
      poolMode: summaryT('bootConfig.poolMode'),
      poolModeDedicated: summaryT('bootConfig.poolModeDedicated'),
      poolModeHybrid: summaryT('bootConfig.poolModeHybrid'),
      pool: summaryT('bootConfig.pool'),
      slots: summaryT('bootConfig.slots'),
      bootReserved: summaryT('bootConfig.bootReserved'),
      updateBios: summaryT('bootConfig.updateBios'),
      devices: summaryT('bootConfig.devices'),
      yes: summaryT('yes'),
      no: summaryT('no'),
    },
    formatBootSize: (bootSizeMiB) =>
      bootSizeMiB === 0
        ? t('onboarding.internalBootStep.bootSize.wholeDrive')
        : t('onboarding.internalBootStep.bootSize.gbLabel', { size: Math.round(bootSizeMiB / 1024) }),
    formatDeviceSize,
    missingStorageSelectionBehavior: 'invalid',
  })
);
const currentStepIndex = computed(() =>
  standaloneSteps.findIndex((step) => step.id === currentStep.value)
);
const createHistorySessionId = () =>
  `internal-boot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getHistoryState = (state: unknown): InternalBootHistoryState | null => {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const candidate = (state as Record<string, unknown>)[INTERNAL_BOOT_HISTORY_STATE_KEY];
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
      ? ((candidate as Record<string, unknown>).stepId as StepId)
      : null;
  const parsedPosition = Number((candidate as Record<string, unknown>).position);
  const position = Number.isInteger(parsedPosition) ? parsedPosition : null;

  if (!sessionId || !stepId || position === null) {
    return null;
  }

  return {
    sessionId,
    stepId,
    position,
  };
};

const buildHistoryState = (stepId: StepId, position: number) => {
  const currentState =
    typeof window.history.state === 'object' && window.history.state !== null
      ? (window.history.state as Record<string, unknown>)
      : {};

  return {
    ...currentState,
    [INTERNAL_BOOT_HISTORY_STATE_KEY]: {
      sessionId: historySessionId.value ?? '',
      stepId,
      position,
    } satisfies InternalBootHistoryState,
  };
};

const clearHistorySession = () => {
  historySessionId.value = null;
  historyPosition.value = -1;
  isApplyingHistoryState.value = false;
};

const addLog = (entry: Omit<LogEntry, 'timestamp'>) => {
  logs.value.push({
    ...entry,
    timestamp: Date.now(),
  });
};

const addLogs = (entries: Array<Omit<LogEntry, 'timestamp'>>) => {
  for (const entry of entries) {
    addLog(entry);
  }
};

const toInternalBootSelection = (draft: OnboardingInternalBootDraft): InternalBootSelection | null => {
  const selection = draft.selection;
  if (
    !selection ||
    !selection.poolName ||
    typeof selection.slotCount !== 'number' ||
    !Array.isArray(selection.devices) ||
    typeof selection.bootSizeMiB !== 'number' ||
    typeof selection.updateBios !== 'boolean' ||
    (selection.poolMode !== 'dedicated' && selection.poolMode !== 'hybrid')
  ) {
    return null;
  }

  return {
    poolName: selection.poolName,
    slotCount: selection.slotCount,
    devices: selection.devices.map((device) => device.id),
    bootSizeMiB: selection.bootSizeMiB,
    updateBios: selection.updateBios,
    poolMode: selection.poolMode,
  };
};

const setResultFromApply = (applyResult: InternalBootApplyResult) => {
  if (applyResult.applySucceeded && !applyResult.hadWarnings) {
    resultSeverity.value = 'success';
    resultTitle.value = summaryT('result.successTitle');
    resultMessage.value = summaryT('result.successMessage');
    return;
  }

  if (applyResult.applySucceeded) {
    resultSeverity.value = 'warning';
    resultTitle.value = summaryT('result.warningsTitle');
    resultMessage.value = summaryT('result.warningsMessage');
    return;
  }

  resultSeverity.value = 'error';
  resultTitle.value = summaryT('result.failedTitle');
  resultMessage.value = t('onboarding.nextSteps.internalBootFailed');
};

const closeLocally = () => {
  cleanupOnboardingStorage();
  isOpen.value = false;
  clearHistorySession();
};

const handleClose = (options?: { fromHistory?: boolean }) => {
  if (isLocked.value) {
    return;
  }
  if (
    typeof window !== 'undefined' &&
    !options?.fromHistory &&
    historySessionId.value &&
    historyPosition.value >= 0
  ) {
    window.history.go(-(historyPosition.value + 1));
    return;
  }

  closeLocally();
};

const handleEditAgain = () => {
  logs.value = [];
  resultSeverity.value = 'success';
  resultTitle.value = '';
  resultMessage.value = '';
  confirmationState.value = 'idle';
  internalBootState.value = createEmptyOnboardingWizardInternalBootState();
  currentStep.value = 'CONFIGURE_BOOT';
};

const handleConfigureStepComplete = async (draft: OnboardingInternalBootDraft) => {
  internalBootDraft.value = {
    bootMode: draft.bootMode ?? 'usb',
    skipped: draft.skipped ?? draft.bootMode !== 'storage',
    selection:
      draft.selection === undefined
        ? null
        : draft.selection === null
          ? null
          : {
              ...draft.selection,
              devices: draft.selection.devices
                ? draft.selection.devices.map((device) => ({ ...device }))
                : [],
            },
  };
  currentStep.value = 'SUMMARY';
};

const handleConfigureStepBack = async (draft: OnboardingInternalBootDraft) => {
  internalBootDraft.value = {
    bootMode: draft.bootMode ?? 'usb',
    skipped: draft.skipped ?? draft.bootMode !== 'storage',
    selection:
      draft.selection === undefined
        ? null
        : draft.selection === null
          ? null
          : {
              ...draft.selection,
              devices: draft.selection.devices
                ? draft.selection.devices.map((device) => ({ ...device }))
                : [],
            },
  };
};

const handleSummaryContinue = async () => {
  logs.value = [];
  internalBootState.value = {
    applyAttempted: internalBootState.value.applyAttempted,
    applySucceeded: false,
  };

  const selection = toInternalBootSelection(internalBootDraft.value);
  if (!selection) {
    addLog({
      message: summaryT('logs.noChanges'),
      type: 'info',
    });
    resultSeverity.value = 'success';
    resultTitle.value = summaryT('result.noChangesTitle');
    resultMessage.value = summaryT('result.noChangesMessage');
    confirmationState.value = 'result';
    return;
  }

  internalBootState.value = {
    applyAttempted: true,
    applySucceeded: false,
  };
  confirmationState.value = 'saving';
  addLog({
    message: summaryT('logs.internalBootStart'),
    type: 'info',
  });
  addLog({
    message: summaryT('logs.internalBootConfiguring'),
    type: 'info',
  });

  const progressTimer = setInterval(() => {
    addLog({
      message: summaryT('logs.internalBootStillRunning'),
      type: 'info',
    });
  }, 10000);

  try {
    const applyResult = await applyInternalBootSelection(selection, {
      configured: summaryT('logs.internalBootConfigured'),
      returnedError: (output) => summaryT('logs.internalBootReturnedError', { output }),
      failed: summaryT('logs.internalBootFailed'),
      biosUnverified: summaryT('logs.internalBootBiosUnverified'),
    });

    if (applyResult.applySucceeded) {
      internalBootState.value = {
        applyAttempted: true,
        applySucceeded: true,
      };
    }

    addLogs(applyResult.logs);
    setResultFromApply(applyResult);
    confirmationState.value = 'result';
  } finally {
    clearInterval(progressTimer);
  }
};

const handlePopstate = (event: PopStateEvent) => {
  if (isLocked.value) {
    window.history.forward();
    return;
  }

  const nextHistoryState = getHistoryState(event.state) ?? getHistoryState(window.history.state);
  const activeSessionId = historySessionId.value;

  if (!activeSessionId) {
    return;
  }

  if (nextHistoryState?.sessionId === activeSessionId) {
    historyPosition.value = nextHistoryState.position;

    if (nextHistoryState.stepId === currentStep.value) {
      return;
    }

    if (currentStep.value === 'SUMMARY' && confirmationState.value === 'saving') {
      window.history.go(1);
      return;
    }

    if (nextHistoryState.stepId === 'CONFIGURE_BOOT' && !canReturnToConfigure()) {
      handleClose({ fromHistory: true });
      return;
    }

    isApplyingHistoryState.value = true;
    currentStep.value = nextHistoryState.stepId;
    isApplyingHistoryState.value = false;
    return;
  }

  handleClose({ fromHistory: true });
};

const handleDialogVisibilityUpdate = (value: boolean) => {
  if (!value && !isLocked.value) {
    handleClose();
  }
};

watch(
  () => [isOpen.value, currentStep.value] as const,
  ([open, stepId]) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!open) {
      clearHistorySession();
      return;
    }

    if (isApplyingHistoryState.value) {
      return;
    }

    const currentHistoryState = getHistoryState(window.history.state);
    if (!historySessionId.value) {
      historySessionId.value = createHistorySessionId();
      historyPosition.value = 0;
      window.history.pushState(
        buildHistoryState(stepId, historyPosition.value),
        '',
        window.location.href
      );
      return;
    }

    if (
      currentHistoryState?.sessionId === historySessionId.value &&
      currentHistoryState.stepId === stepId &&
      currentHistoryState.position === historyPosition.value
    ) {
      return;
    }

    historyPosition.value += 1;
    window.history.pushState(buildHistoryState(stepId, historyPosition.value), '', window.location.href);
  },
  { flush: 'post', immediate: true }
);

onMounted(() => {
  window?.addEventListener('popstate', handlePopstate);
});

onUnmounted(() => {
  window?.removeEventListener('popstate', handlePopstate);
});
</script>

<template>
  <Dialog
    v-if="isOpen"
    :model-value="isOpen"
    :show-footer="false"
    :show-close-button="false"
    size="full"
    class="bg-background pb-0"
    @update:model-value="handleDialogVisibilityUpdate"
  >
    <div class="relative flex h-full min-h-0 w-full flex-col items-center justify-start overflow-y-auto">
      <button
        v-if="!isLocked"
        type="button"
        data-testid="internal-boot-standalone-close"
        class="bg-background/90 text-foreground hover:bg-muted fixed top-5 right-8 z-20 rounded-md p-1.5 shadow-sm transition-colors"
        :aria-label="t('onboarding.modal.closeAriaLabel')"
        @click="() => handleClose()"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>

      <div class="flex min-h-0 w-full flex-1 flex-col items-center px-4 py-8 md:px-6">
        <div class="flex w-full max-w-6xl flex-col items-center gap-8">
          <OnboardingSteps :steps="standaloneSteps" :active-step-index="currentStepIndex" class="mb-2" />

          <div v-if="currentStep === 'CONFIGURE_BOOT'" class="w-full">
            <OnboardingInternalBootStep
              :initial-draft="internalBootDraft"
              :on-complete="handleConfigureStepComplete"
              :on-back="handleConfigureStepBack"
              :show-back="false"
              :show-skip="false"
              :is-saving-step="false"
            />
          </div>

          <div v-else class="flex w-full max-w-5xl flex-col gap-6">
            <div
              v-if="isSaving"
              data-testid="internal-boot-standalone-saving"
              class="border-muted bg-elevated rounded-xl border p-6 shadow-sm md:p-8"
            >
              <div class="flex items-start gap-4">
                <ArrowPathIcon class="text-primary mt-0.5 h-7 w-7 flex-shrink-0 animate-spin" />

                <div class="min-w-0 flex-1 space-y-2">
                  <h2 class="text-highlighted text-xl font-semibold">
                    {{ summaryT('title') }}
                  </h2>
                  <p class="text-muted leading-6">
                    {{ summaryT('description') }}
                  </p>
                </div>
              </div>
            </div>

            <OnboardingConsole v-if="showConsole" :logs="logs" />

            <div
              v-if="confirmationState === 'idle'"
              class="border-muted bg-elevated rounded-xl border p-6 shadow-sm md:p-8"
            >
              <div class="space-y-3">
                <h2 class="text-highlighted text-xl font-semibold">
                  {{ summaryT('title') }}
                </h2>
                <p class="text-muted leading-6">
                  {{ summaryT('description') }}
                </p>
              </div>

              <div v-if="bootConfigurationSummaryState.kind === 'ready'" class="mt-6">
                <OnboardingBootConfigurationSummary :summary="bootConfigurationSummaryState.summary" />
              </div>

              <div
                v-else-if="bootConfigurationSummaryState.kind === 'invalid'"
                data-testid="internal-boot-summary-invalid"
                class="mt-6 rounded-lg border border-amber-200 bg-amber-50/70 p-4"
              >
                <p class="text-sm font-medium text-amber-700">
                  {{ standaloneSummaryInvalidMessage }}
                </p>
              </div>

              <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="text-muted hover:text-highlighted text-sm font-medium transition-colors"
                  @click="handleEditAgain"
                >
                  {{ t('common.back') }}
                </button>
                <button
                  v-if="bootConfigurationSummaryState.kind !== 'invalid'"
                  type="button"
                  class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                  @click="handleSummaryContinue"
                >
                  {{ t('onboarding.summaryStep.confirmAndApply') }}
                </button>
              </div>
            </div>

            <div
              v-if="confirmationState === 'result'"
              data-testid="internal-boot-standalone-result"
              class="border-muted bg-elevated rounded-xl border p-6 shadow-sm md:p-8"
              :class="{
                'border-red-200 bg-red-50/70': resultSeverity === 'error',
                'border-amber-200 bg-amber-50/70': resultSeverity === 'warning',
              }"
            >
              <div class="flex items-start gap-4">
                <CheckCircleIcon
                  v-if="resultSeverity === 'success'"
                  class="text-primary mt-0.5 h-7 w-7 flex-shrink-0"
                />
                <ExclamationTriangleIcon v-else class="mt-0.5 h-7 w-7 flex-shrink-0 text-amber-600" />

                <div class="min-w-0 flex-1 space-y-2">
                  <h2 class="text-highlighted text-xl font-semibold">
                    {{ resultTitle }}
                  </h2>
                  <p class="text-muted leading-6">
                    {{ resultMessage }}
                  </p>
                </div>
              </div>

              <div
                v-if="isLocked && resultSeverity === 'error' && internalBootDraft.selection?.updateBios"
                class="mt-4"
              >
                <p class="text-sm text-amber-700">
                  {{ t('onboarding.nextSteps.internalBootBiosMissed') }}
                </p>
              </div>

              <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  v-if="canEditAgain"
                  type="button"
                  data-testid="internal-boot-standalone-edit-again"
                  class="text-muted hover:text-highlighted text-sm font-medium transition-colors"
                  @click="handleEditAgain"
                >
                  {{ t('common.back') }}
                </button>
                <template v-if="isLocked">
                  <button
                    type="button"
                    data-testid="internal-boot-standalone-shutdown"
                    class="text-muted hover:text-highlighted text-sm font-medium transition-colors"
                    @click="handlePowerAction('shutdown')"
                  >
                    {{ t('onboarding.nextSteps.shutdown') }}
                  </button>
                  <button
                    type="button"
                    data-testid="internal-boot-standalone-reboot"
                    class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                    @click="handlePowerAction('reboot')"
                  >
                    {{ t('onboarding.nextSteps.reboot') }}
                  </button>
                </template>
                <button
                  v-else
                  type="button"
                  data-testid="internal-boot-standalone-result-close"
                  class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                  @click="() => handleClose()"
                >
                  {{ t('common.close') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
