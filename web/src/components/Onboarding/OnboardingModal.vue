<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';
import type {
  OnboardingCoreSettingsDraft,
  OnboardingInternalBootDraft,
  OnboardingPluginsDraft,
  OnboardingWizardDraft,
  OnboardingWizardInternalBootState,
} from '~/components/Onboarding/onboardingWizardState';
import type { StepId } from '~/components/Onboarding/stepRegistry.js';
import type { Component } from 'vue';

import OnboardingLoadingState from '~/components/Onboarding/components/OnboardingLoadingState.vue';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/components/Onboarding/constants';
import { SAVE_ONBOARDING_DRAFT_MUTATION } from '~/components/Onboarding/graphql/saveOnboardingDraft.mutation';
import OnboardingSteps from '~/components/Onboarding/OnboardingSteps.vue';
import {
  cloneOnboardingWizardDraft,
  createEmptyOnboardingWizardDraft,
  createEmptyOnboardingWizardInternalBootState,
  normalizeOnboardingWizardDraft,
} from '~/components/Onboarding/onboardingWizardState';
import { STEP_IDS, stepComponents } from '~/components/Onboarding/stepRegistry.js';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';
import { useOnboardingModalStore } from '~/components/Onboarding/store/onboardingModalVisibility';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { cleanupOnboardingStorage } from '~/components/Onboarding/store/onboardingStorageCleanup';
import { OnboardingWizardStepId } from '~/composables/gql/graphql';
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
const { activationRequired, hasActivationCode } = storeToRefs(useActivationCodeDataStore());
const onboardingStore = useOnboardingStore();
const { isVersionDrift, completedAtVersion, canDisplayOnboardingModal } = storeToRefs(onboardingStore);
const purchaseStore = usePurchaseStore();
const { keyfile } = storeToRefs(useServerStore());
const themeStore = useThemeStore();
const { wizard, loading: onboardingContextLoading } = storeToRefs(useOnboardingContextDataStore());
const { mutate: saveOnboardingDraftMutation } = useMutation(SAVE_ONBOARDING_DRAFT_MUTATION);

const localDraft = ref<OnboardingWizardDraft>(createEmptyOnboardingWizardDraft());
const localCurrentStepId = ref<StepId | null>(null);
const localInternalBootState = ref<OnboardingWizardInternalBootState>(
  createEmptyOnboardingWizardInternalBootState()
);
const hasHydratedWizardState = ref(false);
const isSavingTransition = ref(false);
const saveTransitionError = ref<string | null>(null);
const isInternalBootLocked = computed(() => localInternalBootState.value.applyAttempted);

onMounted(async () => {
  try {
    await themeStore.fetchTheme();
  } catch (error) {
    console.error('Error loading theme:', error);
  }
});

const hasKeyfile = computed(() => Boolean(keyfile.value));
const allowActivationSkip = computed(
  () => hasKeyfile.value || activationRequired.value || showActivationStep.value
);
const showKeyfileHint = computed(() => activationRequired.value && hasKeyfile.value);
const activateHref = computed(() => purchaseStore.generateUrl('activate'));
const activateExternal = computed(() => purchaseStore.openInNewTab);
const HARDCODED_STEPS: Array<{ id: StepId; required: boolean }> = [
  { id: 'OVERVIEW', required: false },
  { id: 'CONFIGURE_SETTINGS', required: false },
  { id: 'CONFIGURE_BOOT', required: false },
  { id: 'ADD_PLUGINS', required: false },
  { id: 'ACTIVATE_LICENSE', required: true },
  { id: 'SUMMARY', required: false },
  { id: 'NEXT_STEPS', required: false },
];
const STEP_ORDER = [...STEP_IDS];
const normalizeStepId = (value: unknown): StepId | null =>
  typeof value === 'string' && STEP_IDS.includes(value as StepId) ? (value as StepId) : null;
const visibleStepIds = computed<StepId[]>(() => {
  const stepIds = wizard.value?.visibleStepIds ?? [];
  const normalized = stepIds
    .map((stepId: unknown) => normalizeStepId(stepId))
    .filter((stepId: StepId | null): stepId is StepId => stepId !== null);
  return normalized.length > 0 ? normalized : ['OVERVIEW'];
});
const availableSteps = computed<StepId[]>(() => visibleStepIds.value);
const showActivationStep = computed(() => availableSteps.value.includes('ACTIVATE_LICENSE'));
const filteredSteps = computed(() =>
  HARDCODED_STEPS.filter((step) => availableSteps.value.includes(step.id))
);

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

const hydrateLocalWizardState = () => {
  localDraft.value = cloneOnboardingWizardDraft(
    wizard.value?.draft
      ? normalizeOnboardingWizardDraft(wizard.value.draft)
      : createEmptyOnboardingWizardDraft()
  );
  localCurrentStepId.value = normalizeStepId(wizard.value?.currentStepId) ?? null;
  localInternalBootState.value = {
    applyAttempted: wizard.value?.internalBootState?.applyAttempted ?? false,
    applySucceeded: wizard.value?.internalBootState?.applySucceeded ?? false,
  };
  saveTransitionError.value = null;
  hasHydratedWizardState.value = true;
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
  const persistedStepId = localCurrentStepId.value;

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

const closeModal = async (reason?: 'SAVE_FAILURE') => {
  try {
    await onboardingModalStore.closeModal(reason);
  } finally {
    cleanupOnboardingStorage();
    clearHistorySession();
    hasHydratedWizardState.value = false;
    window.location.reload();
  }
};

const setActiveStepByIndex = (stepIndex: number) => {
  const stepId = availableSteps.value[stepIndex];
  if (!stepId) {
    return;
  }

  localCurrentStepId.value = stepId;
};

const toWizardStepId = (stepId: StepId): OnboardingWizardStepId => {
  switch (stepId) {
    case 'OVERVIEW':
      return OnboardingWizardStepId.OVERVIEW;
    case 'CONFIGURE_SETTINGS':
      return OnboardingWizardStepId.CONFIGURE_SETTINGS;
    case 'CONFIGURE_BOOT':
      return OnboardingWizardStepId.CONFIGURE_BOOT;
    case 'ADD_PLUGINS':
      return OnboardingWizardStepId.ADD_PLUGINS;
    case 'ACTIVATE_LICENSE':
      return OnboardingWizardStepId.ACTIVATE_LICENSE;
    case 'SUMMARY':
      return OnboardingWizardStepId.SUMMARY;
    case 'NEXT_STEPS':
      return OnboardingWizardStepId.NEXT_STEPS;
  }
};

const buildSaveInput = (nextStepId: StepId) => ({
  input: {
    draft: cloneOnboardingWizardDraft(localDraft.value),
    navigation: {
      currentStepId: toWizardStepId(nextStepId),
    },
    internalBootState: {
      applyAttempted: localInternalBootState.value.applyAttempted,
      applySucceeded: localInternalBootState.value.applySucceeded,
    },
  },
});

const persistStepTransition = async (nextStepId: StepId) => {
  isSavingTransition.value = true;
  saveTransitionError.value = null;

  try {
    const result = await saveOnboardingDraftMutation(buildSaveInput(nextStepId));
    if (!result?.data?.onboarding?.saveOnboardingDraft) {
      throw new Error('saveOnboardingDraft returned false');
    }
    localCurrentStepId.value = nextStepId;
    return true;
  } catch (error) {
    console.error('Failed to save onboarding draft:', error);
    saveTransitionError.value =
      t('onboarding.nextSteps.completionFailed') ||
      "We couldn't save your onboarding progress right now.";
    return false;
  } finally {
    isSavingTransition.value = false;
  }
};

const transitionByOffset = async (offset: number) => {
  if (isSavingTransition.value) {
    return;
  }

  const activeStepIndex = currentDynamicStepIndex.value;
  const nextStepId = availableSteps.value[activeStepIndex + offset];

  if (!nextStepId) {
    if (offset > 0) {
      await closeModal();
    }
    return;
  }

  await persistStepTransition(nextStepId);
};

const goToStep = (stepIndex: number) => {
  if (isInternalBootLocked.value && stepIndex < currentDynamicStepIndex.value) {
    return;
  }
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

const updateCoreSettingsDraft = (draft: OnboardingCoreSettingsDraft) => {
  localDraft.value = cloneOnboardingWizardDraft({
    ...localDraft.value,
    coreSettings: {
      ...draft,
    },
  });
};

const updatePluginsDraft = (draft: OnboardingPluginsDraft) => {
  localDraft.value = cloneOnboardingWizardDraft({
    ...localDraft.value,
    plugins: {
      selectedIds: draft.selectedIds === undefined ? undefined : [...draft.selectedIds],
    },
  });
};

const updateInternalBootDraft = (draft: OnboardingInternalBootDraft) => {
  localDraft.value = cloneOnboardingWizardDraft({
    ...localDraft.value,
    internalBoot: {
      bootMode: draft.bootMode,
      skipped: draft.skipped,
      selection:
        draft.selection === undefined
          ? undefined
          : draft.selection === null
            ? null
            : {
                ...draft.selection,
                devices:
                  draft.selection.devices === undefined
                    ? undefined
                    : draft.selection.devices.map((device) => ({ ...device })),
              },
    },
  });
};

const canGoBack = computed(() => currentDynamicStepIndex.value > 0);
const exitDialogDescription = computed(() =>
  localInternalBootState.value.applySucceeded
    ? t('onboarding.modal.exit.internalBootDescription')
    : t('onboarding.modal.exit.description')
);
const isAwaitingStepData = computed(
  () =>
    showModal.value &&
    (!hasHydratedWizardState.value || (onboardingContextLoading.value && wizard.value === null))
);
const showModalLoadingState = computed(() => isClosingModal.value || isAwaitingStepData.value);
const loadingStateTitle = computed(() =>
  isClosingModal.value ? t('onboarding.modal.closing.title') : t('onboarding.loading.title')
);
const loadingStateDescription = computed(() =>
  isClosingModal.value ? t('onboarding.modal.closing.description') : t('onboarding.loading.description')
);

const handleCoreSettingsComplete = async (draft: OnboardingCoreSettingsDraft) => {
  updateCoreSettingsDraft(draft);
  await transitionByOffset(1);
};

const handleCoreSettingsBack = async (draft: OnboardingCoreSettingsDraft) => {
  updateCoreSettingsDraft(draft);
  await transitionByOffset(-1);
};

const handlePluginsComplete = async (draft: OnboardingPluginsDraft) => {
  updatePluginsDraft(draft);
  await transitionByOffset(1);
};

const handlePluginsSkip = async (draft: OnboardingPluginsDraft) => {
  updatePluginsDraft(draft);
  await transitionByOffset(1);
};

const handlePluginsBack = async (draft: OnboardingPluginsDraft) => {
  updatePluginsDraft(draft);
  await transitionByOffset(-1);
};

const handleInternalBootComplete = async (draft: OnboardingInternalBootDraft) => {
  updateInternalBootDraft(draft);
  await transitionByOffset(1);
};

const handleInternalBootSkip = async (draft: OnboardingInternalBootDraft) => {
  updateInternalBootDraft(draft);
  await transitionByOffset(1);
};

const handleInternalBootBack = async (draft: OnboardingInternalBootDraft) => {
  updateInternalBootDraft(draft);
  await transitionByOffset(-1);
};

const handleSummaryComplete = async () => {
  await transitionByOffset(1);
};

const handleSummaryBack = async () => {
  await transitionByOffset(-1);
};

const handleInternalBootStateChange = async (state: OnboardingWizardInternalBootState) => {
  localInternalBootState.value = {
    applyAttempted: state.applyAttempted,
    applySucceeded: state.applySucceeded,
  };
};

const handleExitIntent = () => {
  if (isClosingModal.value || isInternalBootLocked.value) {
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

const handleSaveFailureClose = async () => {
  if (isClosingModal.value) {
    return;
  }

  isClosingModal.value = true;
  try {
    await closeModal('SAVE_FAILURE');
  } finally {
    isClosingModal.value = false;
  }
};

const handleModalVisibilityUpdate = async (value: boolean) => {
  if (!value) {
    handleExitIntent();
  }
};

const handleExitDialogVisibilityUpdate = (value: boolean) => {
  if (!value) {
    handleExitCancel();
  }
};

const handlePopstate = async (event: PopStateEvent) => {
  if (isInternalBootLocked.value) {
    window.history.forward();
    return;
  }

  const nextHistoryState = getHistoryState(event.state);
  const activeSessionId = historySessionId.value;

  if (!activeSessionId) {
    return;
  }

  if (nextHistoryState?.sessionId === activeSessionId) {
    historyPosition.value = nextHistoryState.position;

    if (
      availableSteps.value.includes(nextHistoryState.stepId) &&
      localCurrentStepId.value !== nextHistoryState.stepId
    ) {
      isApplyingHistoryState.value = true;
      localCurrentStepId.value = nextHistoryState.stepId;
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
    await closeModal();
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

watch(
  () => showModal.value,
  (visible, wasVisible) => {
    if (visible && !wasVisible) {
      if (wizard.value) {
        hydrateLocalWizardState();
      }
      return;
    }

    if (!visible) {
      clearHistorySession();
      hasHydratedWizardState.value = false;
      saveTransitionError.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => wizard.value,
  (value) => {
    if (showModal.value && value && !hasHydratedWizardState.value) {
      hydrateLocalWizardState();
    }
  },
  { immediate: true }
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
    onComplete: () => transitionByOffset(1),
    onBack: () => transitionByOffset(-1),
    showBack: canGoBack.value && !isInternalBootLocked.value,
    isSavingStep: isSavingTransition.value,
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
        initialDraft: localDraft.value.coreSettings ?? null,
        onComplete: handleCoreSettingsComplete,
        onBack: handleCoreSettingsBack,
        showSkip: !hardcodedStep?.required,
        saveError: saveTransitionError.value,
      };
    }

    case 'ADD_PLUGINS': {
      const hardcodedStep = HARDCODED_STEPS.find((s) => s.id === 'ADD_PLUGINS');
      return {
        ...baseProps,
        initialDraft: localDraft.value.plugins ?? null,
        onComplete: handlePluginsComplete,
        onSkip: hardcodedStep?.required ? undefined : handlePluginsSkip,
        onBack: handlePluginsBack,
        showSkip: !hardcodedStep?.required,
        isRequired: hardcodedStep?.required ?? false,
        saveError: saveTransitionError.value,
      };
    }

    case 'CONFIGURE_BOOT': {
      const hardcodedStep = HARDCODED_STEPS.find((s) => s.id === 'CONFIGURE_BOOT');
      return {
        ...baseProps,
        initialDraft: localDraft.value.internalBoot ?? null,
        onComplete: handleInternalBootComplete,
        onSkip: hardcodedStep?.required ? undefined : handleInternalBootSkip,
        onBack: handleInternalBootBack,
        showSkip: !hardcodedStep?.required,
        saveError: saveTransitionError.value,
      };
    }

    case 'ACTIVATE_LICENSE':
      return {
        ...baseProps,
        onComplete: () => transitionByOffset(1),
        onBack: () => transitionByOffset(-1),
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
        draft: localDraft.value,
        internalBootState: localInternalBootState.value,
        onComplete: () => closeModal(),
      };

    case 'SUMMARY':
      return {
        ...baseProps,
        draft: localDraft.value,
        internalBootState: localInternalBootState.value,
        onInternalBootStateChange: handleInternalBootStateChange,
        onComplete: handleSummaryComplete,
        onBack: handleSummaryBack,
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
    @update:model-value="handleModalVisibilityUpdate"
  >
    <div class="relative flex h-full min-h-0 w-full flex-col items-center justify-start overflow-y-auto">
      <button
        v-if="!isInternalBootLocked"
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

          <div
            v-if="saveTransitionError"
            class="mb-6 w-full max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="font-medium">
                {{ saveTransitionError }}
              </p>
              <button
                type="button"
                class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
                :disabled="isClosingModal"
                @click="handleSaveFailureClose"
              >
                {{ t('onboarding.modal.exit.confirm') }}
              </button>
            </div>
          </div>

          <div class="relative w-full">
            <component
              v-if="currentStepComponent"
              :is="currentStepComponent"
              v-bind="currentStepProps"
            />
          </div>
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
    @update:model-value="handleExitDialogVisibilityUpdate"
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
