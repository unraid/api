<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/consts';

import type { BrandButtonProps } from '@unraid/ui';
import type { Component } from 'vue';

import OnboardingPartnerLogo from '~/components/Onboarding/components/OnboardingPartnerLogo.vue';
import OnboardingSteps from '~/components/Onboarding/OnboardingSteps.vue';
import { stepComponents } from '~/components/Onboarding/stepRegistry';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Onboarding/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Onboarding/store/upgradeOnboarding';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo, activationRequired, hasActivationCode } = storeToRefs(useActivationCodeDataStore());
const onboardingStore = useUpgradeOnboardingStore();
const { shouldShowOnboarding, isUpgrade, completedAtVersion } = storeToRefs(onboardingStore);
const { refetchOnboarding } = onboardingStore;
const purchaseStore = usePurchaseStore();
const { keyfile } = storeToRefs(useServerStore());
const themeStore = useThemeStore();

// Ensure theme is loaded when modal opens
(async () => {
  try {
    await themeStore.fetchTheme();
  } catch (error) {
    console.error('Error loading theme:', error);
  }
})();

const hasKeyfile = computed(() => Boolean(keyfile.value));
const allowActivationSkip = computed(() => hasKeyfile.value || activationRequired.value);
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

// Determine which steps to show based on user state
const availableSteps = computed<StepId[]>(() => {
  const isPartnerUser = hasActivationCode.value;

  // For partner users, show all steps including activation
  if (isPartnerUser) {
    return HARDCODED_STEPS.map((s) => s.id);
  }

  // For regular users, exclude the activation step
  return HARDCODED_STEPS.filter((s) => s.id !== 'ACTIVATE_LICENSE').map((s) => s.id);
});

// Filtered steps as full objects for OnboardingSteps component
const filteredSteps = computed(() => {
  const isPartnerUser = hasActivationCode.value;
  if (isPartnerUser) {
    return HARDCODED_STEPS;
  }
  return HARDCODED_STEPS.filter((s) => s.id !== 'ACTIVATE_LICENSE');
});

const showModal = computed(() => isVisible.value || shouldShowOnboarding.value);

const currentStepIndex = ref(0);
const stepSaveState = ref<'idle' | 'saving' | 'saved'>('idle');
let stepSaveTimeout: ReturnType<typeof setTimeout> | null = null;

onBeforeUnmount(() => {
  if (stepSaveTimeout !== null) {
    clearTimeout(stepSaveTimeout);
    stepSaveTimeout = null;
  }
});

// Since we're using simple completed boolean, always start at first step
const setInitialStepIndex = () => {
  currentStepIndex.value = 0;
};

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
  if (isUpgrade.value) {
    return t('onboarding.activationModal.welcomeToUnraidVersion', { version: 'Unraid OS' });
  }
  return t('onboarding.activationModal.letSActivateYourUnraidOs');
});

const modalDescription = computed<string>(() => {
  if (isUpgrade.value && completedAtVersion.value) {
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

const closeModal = async () => {
  if (shouldShowOnboarding.value) {
    await completePendingOnboarding();
  }
  stepSaveState.value = 'idle';
  if (stepSaveTimeout) {
    clearTimeout(stepSaveTimeout);
    stepSaveTimeout = null;
  }
  modalStore.setIsHidden(true);
};

const goToNextStep = async () => {
  if (availableSteps.value.length > 0) {
    // Move to next step
    if (currentStepIndex.value < availableSteps.value.length - 1) {
      currentStepIndex.value++;
    } else {
      // If we're at the last step, close the modal
      await closeModal();
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
  // Allow navigation to any step within available steps (completed or incomplete)
  if (stepIndex >= 0 && stepIndex < availableSteps.value.length) {
    currentStepIndex.value = stepIndex;
  }
};

const canGoBack = computed(() => currentStepIndex.value > 0);

const handleTimezoneComplete = async () => {
  console.log('[OnboardingModal] Timezone complete, moving to next step');
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

// Since we don't track individual step completion on server anymore,
// we just check if step is in progress
const isCurrentStepSaved = computed(() => false);
const isStepSaving = computed(() => stepSaveState.value === 'saving');

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
    isSavingStep: isStepSaving.value,
  };

  switch (step) {
    case 'OVERVIEW':
      console.log('[OnboardingModal] OVERVIEW step props:', {
        isUpgrade: isUpgrade.value,
        completedAtVersion: completedAtVersion.value,
      });
      return {
        ...baseProps,
        isUpgrade: isUpgrade.value,
        completedAtVersion: completedAtVersion.value,
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
        showSkip: !hardcodedStep?.required && !hasActivationCode.value,
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

// No need to watch steps since they're hardcoded
// Just ensure we're on first step when modal opens
watch(
  () => showModal.value,
  (isOpen) => {
    if (isOpen) {
      setInitialStepIndex();
    }
  }
);
</script>

<template>
  <Dialog
    v-if="showModal"
    :model-value="showModal"
    :show-footer="false"
    :show-close-button="isHidden === false || shouldShowOnboarding"
    size="full"
    class="bg-background pb-0"
    @update:model-value="
      async (value) => {
        if (!value) {
          await closeModal();
        }
      }
    "
  >
    <div class="flex h-full w-full flex-col items-center justify-start overflow-y-auto">
      <div v-if="partnerInfo?.hasPartnerLogo && !isUpgrade">
        <OnboardingPartnerLogo :partner-info="partnerInfo" />
      </div>

      <div class="flex w-full flex-col items-center">
        <OnboardingSteps
          :steps="filteredSteps"
          :active-step-index="currentDynamicStepIndex"
          :on-step-click="isStepSaving ? undefined : goToStep"
          class="mb-8"
        />

        <component v-if="currentStepComponent" :is="currentStepComponent" v-bind="currentStepProps" />

        <div
          v-if="stepSaveState !== 'idle' || isCurrentStepSaved"
          class="text-muted-foreground mt-3 text-xs"
          role="status"
        >
          <span v-if="stepSaveState === 'saving'">Saving step...</span>
          <span v-else>Step saved.</span>
        </div>
      </div>
    </div>
  </Dialog>
</template>
