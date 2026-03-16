<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';

import type { BrandButtonProps } from '@unraid/ui';
import type { StepId } from '~/components/Onboarding/stepRegistry.js';
import type { Component } from 'vue';

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

const onboardingModalStore = useOnboardingModalStore();
const { isAutoVisible, isForceOpened, isBypassActive } = storeToRefs(onboardingModalStore);
const { activationRequired, hasActivationCode, isFreshInstall, registrationState } = storeToRefs(
  useActivationCodeDataStore()
);
const onboardingStore = useOnboardingStore();
const { shouldShowOnboarding, isVersionDrift, completedAtVersion, canDisplayOnboardingModal } =
  storeToRefs(onboardingStore);
const { refetchOnboarding } = onboardingStore;
const purchaseStore = usePurchaseStore();
const { keyfile } = storeToRefs(useServerStore());
const themeStore = useThemeStore();
const { internalBootVisibility, loading: onboardingContextLoading } = storeToRefs(
  useOnboardingContextDataStore()
);
const draftStore = useOnboardingDraftStore();
const { currentStepIndex, currentStepId, internalBootApplySucceeded } = storeToRefs(draftStore);

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

const showActivationStep = computed(() => {
  const hasCode = hasActivationCode.value;
  const regState = registrationState.value ?? '';
  return hasCode && ACTIVATION_STEP_REGISTRATION_STATES.has(regState);
});

const showInternalBootStep = computed(() => {
  const setting = internalBootVisibility.value?.enableBootTransfer;
  const bootedFromFlashWithInternalBootSetup =
    internalBootVisibility.value?.bootedFromFlashWithInternalBootSetup === true;
  return (
    typeof setting === 'string' &&
    setting.trim().toLowerCase() === 'yes' &&
    !bootedFromFlashWithInternalBootSetup
  );
});

const preferredStepId = computed<StepId | null>(() => {
  if (currentStepId.value) {
    return currentStepId.value;
  }

  return HARDCODED_STEPS[currentStepIndex.value]?.id ?? null;
});

const shouldKeepResumedInternalBootStep = computed(
  () =>
    onboardingContextLoading.value &&
    preferredStepId.value === 'CONFIGURE_BOOT' &&
    internalBootVisibility.value === null
);

// Determine which steps to show based on user state
const visibleHardcodedSteps = computed(() =>
  HARDCODED_STEPS.filter((step) => showActivationStep.value || step.id !== 'ACTIVATE_LICENSE').filter(
    (step) => {
      if (step.id !== 'CONFIGURE_BOOT') {
        return true;
      }
      return showInternalBootStep.value || shouldKeepResumedInternalBootStep.value;
    }
  )
);
const availableSteps = computed<StepId[]>(() => visibleHardcodedSteps.value.map((step) => step.id));

// Filtered steps as full objects for OnboardingSteps component
const filteredSteps = computed(() => visibleHardcodedSteps.value);

const showModal = computed(() => {
  if (!canDisplayOnboardingModal.value) {
    return false;
  }

  if (isForceOpened.value) {
    return true;
  }

  return isFreshInstall.value && !isBypassActive.value && isAutoVisible.value;
});
const showExitConfirmDialog = ref(false);

const currentStep = computed<StepId | null>(() => {
  const stepId = preferredStepId.value;

  if (stepId && availableSteps.value.includes(stepId)) {
    return stepId;
  }

  if (currentStepIndex.value < availableSteps.value.length) {
    return availableSteps.value[currentStepIndex.value];
  }
  return null;
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
  const stepIndex = currentDynamicStepIndex.value;

  if (!stepId || stepIndex >= availableSteps.value.length) {
    return;
  }

  if (currentStepId.value === null && currentStepIndex.value === 0 && stepId === 'OVERVIEW') {
    return;
  }

  if (currentStepId.value !== stepId || currentStepIndex.value !== stepIndex) {
    draftStore.setCurrentStep(stepId, stepIndex);
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

const { mutate: completeOnboardingMutation } = useMutation(COMPLETE_ONBOARDING_MUTATION);

const completePendingOnboarding = async () => {
  if (!shouldShowOnboarding.value) {
    return;
  }

  try {
    await completeOnboardingMutation();
    await refetchOnboarding();
  } catch (error) {
    console.error('[OnboardingModal] Failed to complete onboarding', error);
  }
};

const closeModal = async (options?: { reload?: boolean }) => {
  const wasForceOpened = isForceOpened.value;

  if (shouldShowOnboarding.value && !wasForceOpened) {
    await completePendingOnboarding();
  }

  if (wasForceOpened) {
    cleanupOnboardingStorage();
  } else {
    cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });
  }
  onboardingModalStore.clearForceOpened();
  onboardingModalStore.setIsHidden(true);

  if (options?.reload) {
    window.location.reload();
  }
};

const setActiveStepByIndex = (stepIndex: number) => {
  const stepId = availableSteps.value[stepIndex];
  if (!stepId) {
    return;
  }

  draftStore.setCurrentStep(stepId, stepIndex);
};

const goToNextStep = async () => {
  if (availableSteps.value.length > 0) {
    const activeStepIndex = currentDynamicStepIndex.value;

    // Move to next step
    if (activeStepIndex < availableSteps.value.length - 1) {
      setActiveStepByIndex(activeStepIndex + 1);
    } else {
      // If we're at the last step, close the modal
      await closeModal({ reload: true });
    }
    return;
  }

  await closeModal();
};

const goToPreviousStep = () => {
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
    setActiveStepByIndex(stepIndex);
  }
};

const canGoBack = computed(() => currentDynamicStepIndex.value > 0);
const exitDialogDescription = computed(() =>
  internalBootApplySucceeded.value
    ? t('onboarding.modal.exit.internalBootDescription')
    : t('onboarding.modal.exit.description')
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
  showExitConfirmDialog.value = true;
};

const handleExitCancel = () => {
  showExitConfirmDialog.value = false;
};

const handleExitConfirm = async () => {
  showExitConfirmDialog.value = false;
  await closeModal();
};

const handleActivationSkip = async () => {
  // Just move to next step without marking complete
  if (currentDynamicStepIndex.value < availableSteps.value.length - 1) {
    setActiveStepByIndex(currentDynamicStepIndex.value + 1);
  } else {
    await closeModal();
  }
};

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
        @click="handleExitIntent"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>

      <div class="flex min-h-0 w-full flex-1 flex-col items-center">
        <OnboardingSteps
          :steps="filteredSteps"
          :active-step-index="currentDynamicStepIndex"
          :on-step-click="goToStep"
          class="mb-8"
        />

        <component v-if="currentStepComponent" :is="currentStepComponent" v-bind="currentStepProps" />
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
          @click="handleExitCancel"
        >
          {{ t('onboarding.modal.exit.keepOnboarding') }}
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          @click="handleExitConfirm"
        >
          {{ t('onboarding.modal.exit.confirm') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
