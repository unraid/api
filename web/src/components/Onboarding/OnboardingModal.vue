<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';
import type { StepId } from '~/components/Onboarding/stepRegistry.js';
import type { Component } from 'vue';

import OnboardingLoadingState from '~/components/Onboarding/components/OnboardingLoadingState.vue';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/components/Onboarding/constants';
import OnboardingSteps from '~/components/Onboarding/OnboardingSteps.vue';
import { stepComponents } from '~/components/Onboarding/stepRegistry.js';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { useOnboardingModalStore } from '~/components/Onboarding/store/onboardingModalVisibility';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { cleanupOnboardingStorage } from '~/components/Onboarding/store/onboardingStorageCleanup';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();
const ONBOARDING_HISTORY_STATE_KEY = '__unraidOnboarding';

type OnboardingHistoryState = {
  sessionId: string;
  stepId: StepId;
  source: 'automatic' | 'manual';
  position: number;
};

const onboardingModalStore = useOnboardingModalStore();
const { isVisible, sessionSource } = storeToRefs(onboardingModalStore);
const {
  activationRequired,
  hasActivationCode,
  registrationState,
  loading: activationDataLoading,
} = storeToRefs(useActivationCodeDataStore());
const onboardingStore = useOnboardingStore();
const { isVersionDrift, completedAtVersion, canDisplayOnboardingModal } = storeToRefs(onboardingStore);
const purchaseStore = usePurchaseStore();
const { keyfile } = storeToRefs(useServerStore());
const themeStore = useThemeStore();
const { internalBootVisibility, loading: onboardingContextLoading } = storeToRefs(
  useOnboardingContextDataStore()
);
const draftStore = useOnboardingDraftStore();
const { currentStepId, internalBootApplySucceeded } = storeToRefs(draftStore);

onMounted(async () => {
  try {
    await themeStore.fetchTheme();
  } catch (error) {
    console.error('Error loading theme:', error);
  }
});

const hasKeyfile = computed(() => Boolean(keyfile.value));
const ACTIVATION_STEP_REGISTRATION_STATES = new Set(['ENOKEYFILE', 'ENOKEYFILE1', 'ENOKEYFILE2']);
const allowActivationSkip = computed(
  () => hasKeyfile.value || activationRequired.value || showActivationStep.value
);
const showKeyfileHint = computed(() => activationRequired.value && hasKeyfile.value);
const activateHref = computed(() => purchaseStore.generateUrl('activate'));
const activateExternal = computed(() => purchaseStore.openInNewTab);

// Hardcoded step definitions - order matters for UI flow
const HARDCODED_STEPS: Array<{ id: StepId; required: boolean }> = [
  { id: 'OVERVIEW', required: false },
  { id: 'CONFIGURE_SETTINGS', required: false },
  { id: 'CONFIGURE_BOOT', required: false },
  { id: 'ADD_PLUGINS', required: false },
  { id: 'ACTIVATE_LICENSE', required: true },
  { id: 'SUMMARY', required: false },
  { id: 'NEXT_STEPS', required: false },
];

const STEP_ORDER = HARDCODED_STEPS.map((step) => step.id);

const showActivationStep = computed(() => {
  const hasCode = hasActivationCode.value;
  const regState = registrationState.value ?? '';
  return hasCode && ACTIVATION_STEP_REGISTRATION_STATES.has(regState);
});

const showInternalBootStep = computed(() => {
  const setting = internalBootVisibility.value?.enableBootTransfer;
  return typeof setting === 'string' && setting.trim().toLowerCase() === 'yes';
});

const shouldKeepResumedInternalBootStep = computed(
  () =>
    onboardingContextLoading.value &&
    currentStepId.value === 'CONFIGURE_BOOT' &&
    internalBootVisibility.value === null
);
const shouldKeepResumedActivationStep = computed(
  () =>
    activationDataLoading.value &&
    currentStepId.value === 'ACTIVATE_LICENSE' &&
    !showActivationStep.value
);

// Determine which steps to show based on user state
const visibleHardcodedSteps = computed(() =>
  HARDCODED_STEPS.filter((step) => {
    if (step.id === 'ACTIVATE_LICENSE') {
      return showActivationStep.value || shouldKeepResumedActivationStep.value;
    }

    if (step.id === 'CONFIGURE_BOOT') {
      return showInternalBootStep.value || shouldKeepResumedInternalBootStep.value;
    }

    return true;
  })
);
const availableSteps = computed<StepId[]>(() => visibleHardcodedSteps.value.map((step) => step.id));

// Filtered steps as full objects for OnboardingSteps component
const filteredSteps = computed(() => visibleHardcodedSteps.value);

const showModal = computed(() => {
  if (!canDisplayOnboardingModal.value) {
    return false;
  }

  return isVisible.value;
});
const isManualSession = computed(() => sessionSource.value === 'manual');
const showExitConfirmDialog = ref(false);
const isClosingModal = ref(false);
const historySessionId = ref<string | null>(null);
const historyPosition = ref(-1);
const isApplyingHistoryState = ref(false);

const createHistorySessionId = () =>
  `onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getHistoryState = (state: unknown): OnboardingHistoryState | null => {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const candidate = (state as Record<string, unknown>)[ONBOARDING_HISTORY_STATE_KEY];
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const sessionId =
    typeof (candidate as Record<string, unknown>).sessionId === 'string'
      ? ((candidate as Record<string, unknown>).sessionId as string)
      : null;
  const stepId =
    typeof (candidate as Record<string, unknown>).stepId === 'string'
      ? ((candidate as Record<string, unknown>).stepId as StepId)
      : null;
  const source = (candidate as Record<string, unknown>).source === 'manual' ? 'manual' : 'automatic';
  const parsedPosition = Number((candidate as Record<string, unknown>).position);
  const position = Number.isInteger(parsedPosition) ? parsedPosition : null;

  if (!sessionId || !stepId || position === null) {
    return null;
  }

  return {
    sessionId,
    stepId,
    source,
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
    [ONBOARDING_HISTORY_STATE_KEY]: {
      sessionId: historySessionId.value ?? '',
      stepId,
      source: sessionSource.value ?? 'automatic',
      position,
    } satisfies OnboardingHistoryState,
  };
};

const clearHistorySession = () => {
  historySessionId.value = null;
  historyPosition.value = -1;
  isApplyingHistoryState.value = false;
};

const getNearestVisibleStepId = (stepId: StepId): StepId | null => {
  const currentOrderIndex = STEP_ORDER.indexOf(stepId);
  if (currentOrderIndex < 0) {
    return availableSteps.value[0] ?? null;
  }

  for (let index = currentOrderIndex + 1; index < STEP_ORDER.length; index += 1) {
    const nextStepId = STEP_ORDER[index];
    if (nextStepId && availableSteps.value.includes(nextStepId)) {
      return nextStepId;
    }
  }

  for (let index = currentOrderIndex - 1; index >= 0; index -= 1) {
    const previousStepId = STEP_ORDER[index];
    if (previousStepId && availableSteps.value.includes(previousStepId)) {
      return previousStepId;
    }
  }

  return availableSteps.value[0] ?? null;
};

const currentStep = computed<StepId | null>(() => {
  const persistedStepId = currentStepId.value;

  if (persistedStepId && availableSteps.value.includes(persistedStepId)) {
    return persistedStepId;
  }

  if (persistedStepId) {
    return getNearestVisibleStepId(persistedStepId);
  }

  return availableSteps.value[0] ?? null;
});

const currentStepComponent = computed<Component | null>(() =>
  currentStep.value ? ((stepComponents as Record<StepId, Component>)[currentStep.value] ?? null) : null
);

const currentDynamicStepIndex = computed(() => {
  if (!currentStep.value) {
    return availableSteps.value.length;
  }
  const index = availableSteps.value.findIndex((id) => id === currentStep.value);
  return index >= 0 ? index : availableSteps.value.length;
});

watchEffect(() => {
  const stepId = currentStep.value;

  if (!stepId || currentDynamicStepIndex.value >= availableSteps.value.length) {
    return;
  }

  if (currentStepId.value === null) {
    return;
  }

  if (currentStepId.value !== stepId) {
    draftStore.setCurrentStep(stepId);
  }
});

const modalTitle = computed<string>(() => {
  if (isVersionDrift.value) {
    return t('onboarding.activationModal.welcomeToUnraidVersion', { version: 'Unraid OS' });
  }
  return t('onboarding.activationModal.letSActivateYourUnraidOs');
});

const modalDescription = computed<string>(() => {
  if (isVersionDrift.value && completedAtVersion.value) {
    return t('onboarding.activationModal.youVeUpgradedFromPrevToCurr', {
      prev: completedAtVersion.value,
      curr: 'current version',
    });
  }
  return t('onboarding.activationModal.onTheFollowingScreenYourLicense');
});

const docsButtons = computed<BrandButtonProps[]>(() => {
  return [
    {
      variant: 'underline',
      external: true,
      href: DOCS_URL_LICENSING_FAQ,
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: t('onboarding.activationModal.moreAboutLicensing'),
    },
    {
      variant: 'underline',
      external: true,
      href: DOCS_URL_ACCOUNT,
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: t('onboarding.activationModal.moreAboutUnraidNetAccounts'),
    },
  ];
});

const closeModal = async (options?: { reload?: boolean }) => {
  if (typeof window !== 'undefined' && isManualSession.value && historyPosition.value >= 0) {
    window.history.go(-(historyPosition.value + 1));
    return;
  }

  await onboardingModalStore.closeModal();
  cleanupOnboardingStorage();
  clearHistorySession();

  if (options?.reload) {
    window.location.reload();
  }
};

const setActiveStepByIndex = (stepIndex: number) => {
  const stepId = availableSteps.value[stepIndex];
  if (!stepId) {
    return;
  }

  draftStore.setCurrentStep(stepId);
};

const goToNextStep = async () => {
  if (availableSteps.value.length > 0) {
    const activeStepIndex = currentDynamicStepIndex.value;

    // Move to next step
    if (activeStepIndex < availableSteps.value.length - 1) {
      setActiveStepByIndex(activeStepIndex + 1);
    } else {
      // If we're at the last step, close the modal
      await closeModal({ reload: !isManualSession.value });
    }
    return;
  }

  await closeModal();
};

const goToPreviousStep = () => {
  if (typeof window !== 'undefined' && historySessionId.value && historyPosition.value > 0) {
    window.history.back();
    return;
  }

  if (currentDynamicStepIndex.value > 0) {
    setActiveStepByIndex(currentDynamicStepIndex.value - 1);
  }
};

const goToStep = (stepIndex: number) => {
  // Prevent skipping ahead via stepper; only allow current or previous steps.
  if (
    stepIndex >= 0 &&
    stepIndex < availableSteps.value.length &&
    stepIndex <= currentDynamicStepIndex.value
  ) {
    if (typeof window !== 'undefined' && historySessionId.value) {
      const delta = stepIndex - currentDynamicStepIndex.value;
      if (delta < 0) {
        window.history.go(delta);
        return;
      }
    }

    setActiveStepByIndex(stepIndex);
  }
};

const canGoBack = computed(() => currentDynamicStepIndex.value > 0);
const exitDialogDescription = computed(() =>
  internalBootApplySucceeded.value
    ? t('onboarding.modal.exit.internalBootDescription')
    : t('onboarding.modal.exit.description')
);
const isAwaitingStepData = computed(() => onboardingContextLoading.value && !currentStepComponent.value);
const showModalLoadingState = computed(() => isClosingModal.value || isAwaitingStepData.value);
const loadingStateTitle = computed(() =>
  isClosingModal.value ? t('onboarding.modal.closing.title') : t('onboarding.loading.title')
);
const loadingStateDescription = computed(() =>
  isClosingModal.value ? t('onboarding.modal.closing.description') : t('onboarding.loading.description')
);

const handleTimezoneComplete = async () => {
  await goToNextStep();
};

const handleTimezoneSkip = async () => {
  await goToNextStep();
};

const handlePluginsComplete = async () => {
  await goToNextStep();
};

const handlePluginsSkip = async () => {
  await goToNextStep();
};

const handleInternalBootComplete = async () => {
  await goToNextStep();
};

const handleInternalBootSkip = async () => {
  await goToNextStep();
};

const handleExitIntent = () => {
  if (isClosingModal.value) {
    return;
  }
  showExitConfirmDialog.value = true;
};

const handleExitCancel = () => {
  if (isClosingModal.value) {
    return;
  }
  showExitConfirmDialog.value = false;
};

const handleExitConfirm = async () => {
  showExitConfirmDialog.value = false;
  isClosingModal.value = true;
  try {
    await closeModal();
  } finally {
    isClosingModal.value = false;
  }
};

const handleActivationSkip = async () => {
  // Just move to next step without marking complete
  if (currentDynamicStepIndex.value < availableSteps.value.length - 1) {
    setActiveStepByIndex(currentDynamicStepIndex.value + 1);
  } else {
    await closeModal({ reload: !isManualSession.value });
  }
};

const handlePopstate = async (event: PopStateEvent) => {
  const nextHistoryState = getHistoryState(event.state);
  const activeSessionId = historySessionId.value;

  if (!activeSessionId) {
    return;
  }

  if (nextHistoryState?.sessionId === activeSessionId) {
    historyPosition.value = nextHistoryState.position;

    if (
      availableSteps.value.includes(nextHistoryState.stepId) &&
      currentStepId.value !== nextHistoryState.stepId
    ) {
      isApplyingHistoryState.value = true;
      draftStore.setCurrentStep(nextHistoryState.stepId);
      await nextTick();
      isApplyingHistoryState.value = false;
    }
    return;
  }

  if (!showModal.value || !isManualSession.value) {
    return;
  }

  showExitConfirmDialog.value = false;
  isClosingModal.value = true;
  try {
    await onboardingModalStore.closeModal();
    cleanupOnboardingStorage();
    clearHistorySession();
  } finally {
    isClosingModal.value = false;
  }
};

watch(
  () => [showModal.value, currentStep.value, sessionSource.value] as const,
  ([visible, stepId]) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!visible || !stepId) {
      if (!visible) {
        clearHistorySession();
      }
      return;
    }

    if (isApplyingHistoryState.value) {
      return;
    }

    const currentHistoryState = getHistoryState(window.history.state);
    if (!historySessionId.value) {
      historySessionId.value = createHistorySessionId();
      historyPosition.value = 0;
      const method = isManualSession.value ? 'pushState' : 'replaceState';
      window.history[method](buildHistoryState(stepId, historyPosition.value), '', window.location.href);
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

const currentStepProps = computed<Record<string, unknown>>(() => {
  const step = currentStep.value;
  if (!step) {
    return {};
  }

  const baseProps = {
    onComplete: () => goToNextStep(),
    onBack: goToPreviousStep,
    showBack: canGoBack.value,
    isCompleted: false, // No server-side step completion tracking
    isSavingStep: false,
  };

  switch (step) {
    case 'OVERVIEW':
      return {
        ...baseProps,
        isUpgrade: isVersionDrift.value,
        completedAtVersion: completedAtVersion.value,
        onSkipSetup: handleExitIntent,
        onSkip: undefined,
        showSkip: false,
      };

    case 'CONFIGURE_SETTINGS': {
      const hardcodedStep = HARDCODED_STEPS.find((s) => s.id === 'CONFIGURE_SETTINGS');
      return {
        ...baseProps,
        onComplete: handleTimezoneComplete,
        onSkip: hardcodedStep?.required ? undefined : handleTimezoneSkip,
        showSkip: !hardcodedStep?.required,
      };
    }

    case 'ADD_PLUGINS': {
      const hardcodedStep = HARDCODED_STEPS.find((s) => s.id === 'ADD_PLUGINS');
      return {
        ...baseProps,
        onComplete: handlePluginsComplete,
        onSkip: hardcodedStep?.required ? undefined : handlePluginsSkip,
        showSkip: !hardcodedStep?.required,
        isRequired: hardcodedStep?.required ?? false,
      };
    }

    case 'CONFIGURE_BOOT': {
      const hardcodedStep = HARDCODED_STEPS.find((s) => s.id === 'CONFIGURE_BOOT');
      return {
        ...baseProps,
        onComplete: handleInternalBootComplete,
        onSkip: hardcodedStep?.required ? undefined : handleInternalBootSkip,
        showSkip: !hardcodedStep?.required,
      };
    }

    case 'ACTIVATE_LICENSE':
      return {
        ...baseProps,
        onComplete: handleActivationSkip,
        modalTitle: modalTitle.value,
        modalDescription: modalDescription.value,
        docsButtons: docsButtons.value,
        canGoBack: canGoBack.value,
        activateHref: activateHref.value,
        activateExternal: activateExternal.value,
        allowSkip: allowActivationSkip.value,
        showKeyfileHint: showKeyfileHint.value,
        showActivationCodeHint: hasActivationCode.value,
      };

    case 'NEXT_STEPS':
      return {
        ...baseProps,
        onComplete: () => closeModal({ reload: !isManualSession.value }),
      };

    default:
      return baseProps;
  }
});
</script>

<template>
  <Dialog
    v-if="showModal"
    :model-value="showModal"
    :show-footer="false"
    :show-close-button="false"
    size="full"
    class="bg-background pb-0"
    @update:model-value="
      async (value) => {
        if (!value) {
          handleExitIntent();
        }
      }
    "
  >
    <div class="relative flex h-full min-h-0 w-full flex-col items-center justify-start overflow-y-auto">
      <button
        type="button"
        class="bg-background/90 text-foreground hover:bg-muted fixed top-5 right-8 z-20 rounded-md p-1.5 shadow-sm transition-colors"
        :aria-label="t('onboarding.modal.closeAriaLabel')"
        :disabled="isClosingModal"
        @click="handleExitIntent"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>

      <div class="flex min-h-0 w-full flex-1 flex-col items-center">
        <template v-if="showModalLoadingState">
          <div class="flex w-full max-w-4xl flex-1 items-center px-4 pb-4 md:px-8">
            <OnboardingLoadingState :title="loadingStateTitle" :description="loadingStateDescription" />
          </div>
        </template>
        <template v-else>
          <OnboardingSteps
            :steps="filteredSteps"
            :active-step-index="currentDynamicStepIndex"
            :on-step-click="goToStep"
            class="mb-8"
          />

          <component v-if="currentStepComponent" :is="currentStepComponent" v-bind="currentStepProps" />
        </template>
      </div>
    </div>
  </Dialog>

  <Dialog
    v-if="showExitConfirmDialog"
    :model-value="showExitConfirmDialog"
    :show-footer="false"
    :show-close-button="false"
    size="md"
    class="max-w-md"
    @update:model-value="
      (value) => {
        if (!value) {
          handleExitCancel();
        }
      }
    "
  >
    <div class="space-y-6 p-2">
      <div class="space-y-2">
        <h3 class="text-lg font-semibold">{{ t('onboarding.modal.exit.title') }}</h3>
        <p class="text-muted-foreground text-sm">
          {{ exitDialogDescription }}
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="border-muted text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm"
          :disabled="isClosingModal"
          @click="handleExitCancel"
        >
          {{ t('onboarding.modal.exit.keepOnboarding') }}
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          :disabled="isClosingModal"
          @click="handleExitConfirm"
        >
          {{ t('onboarding.modal.exit.confirm') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
