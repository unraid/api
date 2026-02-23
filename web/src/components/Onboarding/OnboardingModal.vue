<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/consts';

import type { BrandButtonProps } from '@unraid/ui';
import type { Component } from 'vue';

import OnboardingSteps from '~/components/Onboarding/OnboardingSteps.vue';
import { stepComponents } from '~/components/Onboarding/stepRegistry';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Onboarding/store/activationCodeModal';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { cleanupOnboardingStorage } from '~/components/Onboarding/store/onboardingStorageCleanup';
import { useUpgradeOnboardingStore } from '~/components/Onboarding/store/upgradeOnboarding';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isTemporarilyBypassed } = storeToRefs(modalStore);
const { activationRequired, hasActivationCode, registrationState } = storeToRefs(
  useActivationCodeDataStore()
);
const onboardingStore = useUpgradeOnboardingStore();
const { shouldShowOnboarding, isVersionDrift, completedAtVersion, canDisplayOnboardingModal } =
  storeToRefs(onboardingStore);
const { refetchOnboarding } = onboardingStore;
const purchaseStore = usePurchaseStore();
const { keyfile } = storeToRefs(useServerStore());
const themeStore = useThemeStore();
const draftStore = useOnboardingDraftStore();
const { currentStepIndex } = storeToRefs(draftStore);

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

// Hardcoded step IDs matching the actual step flow
type StepId =
  | 'OVERVIEW'
  | 'CONFIGURE_SETTINGS'
  | 'ADD_PLUGINS'
  | 'ACTIVATE_LICENSE'
  | 'SUMMARY'
  | 'NEXT_STEPS';

// Hardcoded step definitions - order matters for UI flow
const HARDCODED_STEPS: Array<{ id: StepId; required: boolean }> = [
  { id: 'OVERVIEW', required: false },
  { id: 'CONFIGURE_SETTINGS', required: false },
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

// Determine which steps to show based on user state
const availableSteps = computed<StepId[]>(() => {
  if (showActivationStep.value) {
    return HARDCODED_STEPS.map((s) => s.id);
  }
  return HARDCODED_STEPS.filter((s) => s.id !== 'ACTIVATE_LICENSE').map((s) => s.id);
});

// Filtered steps as full objects for OnboardingSteps component
const filteredSteps = computed(() => {
  if (showActivationStep.value) {
    return HARDCODED_STEPS;
  }
  return HARDCODED_STEPS.filter((s) => s.id !== 'ACTIVATE_LICENSE');
});

const isLoginPage = computed(() => {
  const hasLoginRoute = window.location.pathname.includes('login');
  const hasLoginMarkup = Boolean(document.querySelector('#login, form[action="/login"]'));
  return hasLoginRoute || hasLoginMarkup;
});
const showModal = computed(
  () =>
    !isLoginPage.value &&
    canDisplayOnboardingModal.value &&
    !isTemporarilyBypassed.value &&
    (isVisible.value || shouldShowOnboarding.value)
);
const showExitConfirmDialog = ref(false);

const currentStep = computed<StepId | null>(() => {
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
  if (shouldShowOnboarding.value) {
    await completePendingOnboarding();
  }

  cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });
  modalStore.setIsHidden(true);

  if (options?.reload) {
    window.location.reload();
  }
};

const goToNextStep = async () => {
  if (availableSteps.value.length > 0) {
    // Move to next step
    if (currentStepIndex.value < availableSteps.value.length - 1) {
      currentStepIndex.value++;
    } else {
      // If we're at the last step, close the modal
      await closeModal({ reload: true });
    }
    return;
  }

  await closeModal();
};

const goToPreviousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
};

const goToStep = (stepIndex: number) => {
  // Prevent skipping ahead via stepper; only allow current or previous steps.
  if (stepIndex >= 0 && stepIndex < availableSteps.value.length && stepIndex <= currentStepIndex.value) {
    currentStepIndex.value = stepIndex;
  }
};

const canGoBack = computed(() => currentStepIndex.value > 0);

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
  if (currentStepIndex.value < availableSteps.value.length - 1) {
    currentStepIndex.value++;
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

    case 'SUMMARY':
    case 'NEXT_STEPS':
      return {
        ...baseProps,
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
        aria-label="Close onboarding"
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
        <h3 class="text-lg font-semibold">Exit onboarding?</h3>
        <p class="text-muted-foreground text-sm">
          You can skip setup now and continue from the dashboard later.
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="border-muted text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm"
          @click="handleExitCancel"
        >
          Keep onboarding
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          @click="handleExitConfirm"
        >
          Exit setup
        </button>
      </div>
    </div>
  </Dialog>
</template>
