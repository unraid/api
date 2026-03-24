<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import { applyInternalBootSelection } from '@/components/Onboarding/composables/internalBoot';
import OnboardingSteps from '@/components/Onboarding/OnboardingSteps.vue';
import OnboardingInternalBootStep from '@/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import { useOnboardingDraftStore } from '@/components/Onboarding/store/onboardingDraft';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';
import type { InternalBootApplyResult } from '@/components/Onboarding/composables/internalBoot';
import type { StepId } from '@/components/Onboarding/stepRegistry';

const { t } = useI18n();
const draftStore = useOnboardingDraftStore();

const currentStep = ref<StepId>('CONFIGURE_BOOT');
const confirmationState = ref<'idle' | 'saving' | 'result'>('idle');
const isOpen = ref(true);
const logs = ref<LogEntry[]>([]);
const resultTitle = ref('');
const resultMessage = ref('');
const resultSeverity = ref<'success' | 'warning' | 'error'>('success');
const standaloneSteps: Array<{ id: StepId; required: boolean }> = [
  { id: 'CONFIGURE_BOOT', required: true },
  { id: 'SUMMARY', required: true },
];

const summaryT = (key: string, values?: Record<string, unknown>) =>
  t(`onboarding.summaryStep.${key}`, values ?? {});

const showConsole = computed(() => confirmationState.value === 'saving' || logs.value.length > 0);
const isSaving = computed(() => confirmationState.value === 'saving');
const canEditAgain = computed(
  () =>
    currentStep.value === 'SUMMARY' &&
    confirmationState.value === 'result' &&
    resultSeverity.value !== 'success'
);
const currentStepIndex = computed(() =>
  standaloneSteps.findIndex((step) => step.id === currentStep.value)
);

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
  resultMessage.value = summaryT('result.failedMessage');
};

const handleClose = () => {
  isOpen.value = false;
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
    resultTitle.value = summaryT('result.successTitle');
    resultMessage.value = summaryT('result.successMessage');
    confirmationState.value = 'result';
    return;
  }

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
        if (!value) {
          handleClose();
        }
      }
    "
  >
    <div class="relative flex h-full min-h-0 w-full flex-col items-center justify-start overflow-y-auto">
      <button
        type="button"
        data-testid="internal-boot-standalone-close"
        class="bg-background/90 text-foreground hover:bg-muted fixed top-5 right-8 z-20 rounded-md p-1.5 shadow-sm transition-colors"
        :aria-label="t('onboarding.modal.closeAriaLabel')"
        @click="handleClose"
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
                <button
                  type="button"
                  data-testid="internal-boot-standalone-result-close"
                  class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                  @click="handleClose"
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
