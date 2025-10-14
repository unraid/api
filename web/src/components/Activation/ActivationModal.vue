<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Dialog } from '@unraid/ui';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/consts';

import type { BrandButtonProps } from '@unraid/ui';
import type { ActivationOnboardingQuery } from '~/composables/gql/graphql';
import type { Component } from 'vue';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import { COMPLETE_UPGRADE_STEP_MUTATION } from '~/components/Activation/completeUpgradeStep.mutation';
import { stepComponents } from '~/components/Activation/stepRegistry';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo, activationCode } = storeToRefs(useActivationCodeDataStore());
const upgradeStore = useUpgradeOnboardingStore();
const { shouldShowUpgradeOnboarding, upgradeSteps, allUpgradeSteps, currentVersion, previousVersion } =
  storeToRefs(upgradeStore);
const { refetchActivationOnboarding } = upgradeStore;
const purchaseStore = usePurchaseStore();

const themeStore = useThemeStore();

// Apply theme when modal opens
(async () => {
  try {
    await themeStore.setTheme();
    // Ensure CSS variables are applied
    themeStore.setCssVars();
  } catch (error) {
    console.error('Error setting theme:', error);
  }
})();

const hasActivationCode = computed(() => Boolean(activationCode.value?.code));

type StepId = ActivationOnboardingQuery['activationOnboarding']['steps'][number]['id'];

const allStepIds = computed<StepId[]>(() => allUpgradeSteps.value.map((step) => step.id as StepId));

const showModal = computed(() => isVisible.value || shouldShowUpgradeOnboarding.value);

const availableSteps = computed<StepId[]>(() => allUpgradeSteps.value.map((step) => step.id as StepId));

const currentStepIndex = ref(0);

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
    return allStepIds.value.length;
  }
  const index = allStepIds.value.findIndex((id) => id === currentStep.value);
  return index >= 0 ? index : allStepIds.value.length;
});

const modalTitle = computed<string>(() => {
  if (shouldShowUpgradeOnboarding.value && upgradeSteps.value.length > 0 && currentVersion.value) {
    return t('activation.activationModal.welcomeToUnraidVersion', { version: currentVersion.value });
  }
  return t('activation.activationModal.letSActivateYourUnraidOs');
});

const modalDescription = computed<string>(() => {
  if (
    shouldShowUpgradeOnboarding.value &&
    upgradeSteps.value.length > 0 &&
    previousVersion.value &&
    currentVersion.value
  ) {
    return t('activation.activationModal.youVeUpgradedFromPrevToCurr', {
      prev: previousVersion.value,
      curr: currentVersion.value,
    });
  }
  return t('activation.activationModal.onTheFollowingScreenYourLicense');
});

const docsButtons = computed<BrandButtonProps[]>(() => {
  return [
    {
      variant: 'underline',
      external: true,
      href: DOCS_URL_LICENSING_FAQ,
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: t('activation.activationModal.moreAboutLicensing'),
    },
    {
      variant: 'underline',
      external: true,
      href: DOCS_URL_ACCOUNT,
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: t('activation.activationModal.moreAboutUnraidNetAccounts'),
    },
  ];
});

const closeModal = () => {
  upgradeStore.setIsHidden(true);
  modalStore.setIsHidden(true);
};

const { mutate: completeUpgradeStepMutation } = useMutation(COMPLETE_UPGRADE_STEP_MUTATION);

const markUpgradeStepCompleted = async (stepId: StepId | null) => {
  if (!stepId) return;

  try {
    await completeUpgradeStepMutation({ input: { stepId } });
    await refetchActivationOnboarding();
  } catch (error) {
    console.error('[ActivationModal] Failed to mark upgrade step completed', error);
  }
};

const goToNextStep = async () => {
  if (availableSteps.value.length > 0) {
    // Only mark as completed if the current step is not already completed
    const currentStepData = allUpgradeSteps.value[currentStepIndex.value];
    if (currentStepData && !currentStepData.completed) {
      await markUpgradeStepCompleted(currentStep.value);
    }

    // Move to next step
    if (currentStepIndex.value < availableSteps.value.length - 1) {
      currentStepIndex.value++;
    } else {
      // If we're at the last step, close the modal
      closeModal();
    }
    return;
  }

  closeModal();
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
  console.log('[ActivationModal] Timezone complete, moving to next step');
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

const currentStepConfig = computed(() => {
  return allUpgradeSteps.value[currentStepIndex.value] ?? null;
});

const currentStepProps = computed<Record<string, unknown>>(() => {
  const step = currentStep.value;
  if (!step) {
    return {};
  }

  const stepConfig = currentStepConfig.value;

  const isCurrentStepCompleted = stepConfig?.completed ?? false;

  const baseProps = {
    onComplete: () => goToNextStep(),
    onBack: goToPreviousStep,
    showBack: canGoBack.value,
    isCompleted: isCurrentStepCompleted,
  };

  switch (step) {
    case 'WELCOME':
      console.log('[ActivationModal] WELCOME step props:', {
        currentVersion: currentVersion.value,
        previousVersion: previousVersion.value,
      });
      return {
        ...baseProps,
        currentVersion: currentVersion.value,
        previousVersion: previousVersion.value,
        onComplete: closeModal,
        onSkip: undefined,
        showSkip: false,
      };

    case 'TIMEZONE':
      return {
        ...baseProps,
        onComplete: handleTimezoneComplete,
        onSkip: stepConfig?.required ? undefined : handleTimezoneSkip,
        showSkip: !stepConfig?.required,
      };

    case 'PLUGINS':
      return {
        ...baseProps,
        onComplete: handlePluginsComplete,
        onSkip: stepConfig?.required ? undefined : handlePluginsSkip,
        showSkip: !stepConfig?.required && !hasActivationCode.value,
      };

    case 'ACTIVATION':
      return {
        ...baseProps,
        modalTitle: modalTitle.value,
        modalDescription: modalDescription.value,
        docsButtons: docsButtons.value,
        canGoBack: canGoBack.value,
        purchaseStore,
      };

    default:
      return baseProps;
  }
});

// Set to appropriate step on initial load
watch(
  () => allUpgradeSteps.value,
  (newSteps) => {
    // Only set step if this is the first time we're getting steps
    // and we haven't manually navigated to a different step
    if (newSteps.length > 0 && currentStepIndex.value === 0) {
      const firstIncomplete = newSteps.findIndex((step) => !step.completed);
      if (firstIncomplete >= 0) {
        // Start at first incomplete step
        currentStepIndex.value = firstIncomplete;
      } else {
        // All steps are completed, start at the last step
        currentStepIndex.value = newSteps.length - 1;
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <Dialog
    v-if="showModal"
    :model-value="showModal"
    :show-footer="false"
    :show-close-button="isHidden === false || shouldShowUpgradeOnboarding"
    size="full"
    class="bg-background"
    @update:model-value="(value) => !value && closeModal()"
  >
    <div class="flex flex-col items-center justify-start">
      <div v-if="partnerInfo?.hasPartnerLogo && !shouldShowUpgradeOnboarding">
        <ActivationPartnerLogo :partner-info="partnerInfo" />
      </div>

      <div class="flex w-full flex-col items-center">
        <component v-if="currentStepComponent" :is="currentStepComponent" v-bind="currentStepProps" />

        <ActivationSteps
          :steps="allUpgradeSteps"
          :active-step-index="currentDynamicStepIndex"
          :on-step-click="goToStep"
          class="mt-6"
        />
      </div>
    </div>
  </Dialog>
</template>
