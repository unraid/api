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
import InternalBootConfirmDialog from '@/components/Onboarding/components/InternalBootConfirmDialog.vue';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import {
  applyInternalBootSelection,
  submitInternalBootReboot,
  submitInternalBootShutdown,
} from '@/components/Onboarding/composables/internalBoot';
import OnboardingSteps from '@/components/Onboarding/OnboardingSteps.vue';
import OnboardingInternalBootStep from '@/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import { useOnboardingDraftStore } from '@/components/Onboarding/store/onboardingDraft';
import { cleanupOnboardingStorage } from '@/components/Onboarding/store/onboardingStorageCleanup';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';
import type { InternalBootApplyResult } from '@/components/Onboarding/composables/internalBoot';
import type { StepId } from '@/components/Onboarding/stepRegistry';

const { t } = useI18n();
const draftStore = useOnboardingDraftStore();
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
const standaloneSteps: Array<{ id: StepId; required: boolean }> = [
  { id: 'CONFIGURE_BOOT', required: true },
  { id: 'SUMMARY', required: true },
];

const summaryT = (key: string, values?: Record<string, unknown>) =>
  t(`onboarding.summaryStep.${key}`, values ?? {});

const isLocked = computed(() => draftStore.internalBootApplyAttempted);
const internalBootFailed = computed(() => isLocked.value && !draftStore.internalBootApplySucceeded);
const pendingPowerAction = ref<'reboot' | 'shutdown' | null>(null);

const handleConfirmPowerAction = () => {
  const action = pendingPowerAction.value;
  pendingPowerAction.value = null;
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
  (resultSeverity.value !== 'success' || !draftStore.internalBootApplySucceeded);

const showConsole = computed(() => confirmationState.value === 'saving' || logs.value.length > 0);
const isSaving = computed(() => confirmationState.value === 'saving');
const canEditAgain = computed(() => currentStep.value === 'SUMMARY' && canReturnToConfigure());
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
  currentStep.value = 'CONFIGURE_BOOT';
};

const handleStepComplete = async () => {
  logs.value = [];
  draftStore.setInternalBootApplySucceeded(false);
  currentStep.value = 'SUMMARY';

  const selection = draftStore.internalBootSelection;
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

  draftStore.setInternalBootApplyAttempted(true);
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
      draftStore.setInternalBootApplySucceeded(true);
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
    @update:model-value="
      (value) => {
        if (!value && !isLocked) {
          handleClose();
        }
      }
    "
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
              :on-complete="handleStepComplete"
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
                v-if="
                  isLocked && resultSeverity === 'error' && draftStore.internalBootSelection?.updateBios
                "
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
                    @click="pendingPowerAction = 'shutdown'"
                  >
                    {{ t('onboarding.nextSteps.shutdown') }}
                  </button>
                  <button
                    type="button"
                    data-testid="internal-boot-standalone-reboot"
                    class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                    @click="pendingPowerAction = 'reboot'"
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

  <InternalBootConfirmDialog
    :open="pendingPowerAction !== null"
    :action="pendingPowerAction ?? 'reboot'"
    :failed="internalBootFailed"
    @confirm="handleConfirmPowerAction"
    @cancel="pendingPowerAction = null"
  />
</template>
