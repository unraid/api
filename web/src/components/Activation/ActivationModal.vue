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
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo, activationRequired, hasActivationCode } = storeToRefs(useActivationCodeDataStore());
const upgradeStore = useUpgradeOnboardingStore();
const { shouldShowUpgradeOnboarding, upgradeSteps, allUpgradeSteps, currentVersion, previousVersion } =
  storeToRefs(upgradeStore);
const { refetchActivationOnboarding } = upgradeStore;
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

type StepId = ActivationOnboardingQuery['activationOnboarding']['steps'][number]['id'];

const allStepIds = computed<StepId[]>(() => allUpgradeSteps.value.map((step) => step.id as StepId));

const showModal = computed(() => isVisible.value || shouldShowUpgradeOnboarding.value);

const availableSteps = computed<StepId[]>(() => allUpgradeSteps.value.map((step) => step.id as StepId));

const currentStepIndex = ref(0);
const stepSaveState = ref<'idle' | 'saving' | 'saved'>('idle');
let stepSaveTimeout: ReturnType<typeof setTimeout> | null = null;

const resolveInitialStepIndex = (steps: ActivationOnboardingQuery['activationOnboarding']['steps']) => {
  if (steps.length === 0) {
    return 0;
  }
  const firstIncomplete = steps.findIndex((step) => !step.completed);
  return firstIncomplete >= 0 ? firstIncomplete : Math.max(steps.length - 1, 0);
};

const setInitialStepIndex = (
  steps: ActivationOnboardingQuery['activationOnboarding']['steps'] = allUpgradeSteps.value
) => {
  currentStepIndex.value = resolveInitialStepIndex(steps);
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

type MarkUpgradeStepOptions = {
  skipRefetch?: boolean;
  showStatus?: boolean;
};

const { mutate: completeUpgradeStepMutation } = useMutation(COMPLETE_UPGRADE_STEP_MUTATION);

const markUpgradeStepCompleted = async (stepId: StepId | null, options: MarkUpgradeStepOptions = {}) => {
  if (!stepId) return;
  const showStatus = options.showStatus !== false;

  if (showStatus) {
    if (stepSaveTimeout) {
      clearTimeout(stepSaveTimeout);
      stepSaveTimeout = null;
    }
    stepSaveState.value = 'saving';
  }

  try {
    await completeUpgradeStepMutation({ input: { stepId } });
    if (!options.skipRefetch) {
      await refetchActivationOnboarding();
    }
    if (showStatus) {
      stepSaveState.value = 'saved';
      stepSaveTimeout = setTimeout(() => {
        stepSaveState.value = 'idle';
        stepSaveTimeout = null;
      }, 2000);
    }
  } catch (error) {
    console.error('[ActivationModal] Failed to mark upgrade step completed', error);
    if (showStatus) {
      stepSaveState.value = 'idle';
    }
  }
};

const completePendingUpgradeSteps = async () => {
  if (!shouldShowUpgradeOnboarding.value) {
    return;
  }

  const pendingSteps = upgradeSteps.value.map((step) => step.id as StepId);
  if (pendingSteps.length === 0) {
    return;
  }

  try {
    for (const stepId of pendingSteps) {
      await markUpgradeStepCompleted(stepId, { skipRefetch: true, showStatus: false });
    }
    await refetchActivationOnboarding();
  } catch (error) {
    console.error('[ActivationModal] Failed to complete pending upgrade steps', error);
  }
};

const closeModal = async () => {
  if (shouldShowUpgradeOnboarding.value) {
    await completePendingUpgradeSteps();
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

const isCurrentStepSaved = computed(() => currentStepConfig.value?.completed ?? false);

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
        isRequired: stepConfig?.required ?? false,
      };

    case 'ACTIVATION':
      return {
        ...baseProps,
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

watch(
  () => showModal.value,
  (isOpen) => {
    if (isOpen) {
      setInitialStepIndex();
    }
  }
);

watch(
  () => allUpgradeSteps.value,
  (newSteps) => {
    if (newSteps.length === 0) {
      currentStepIndex.value = 0;
      return;
    }

    if (!showModal.value) {
      setInitialStepIndex(newSteps);
      return;
    }

    if (!currentStep.value || !newSteps.some((step) => step.id === currentStep.value)) {
      setInitialStepIndex(newSteps);
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
    @update:model-value="
      async (value) => {
        if (!value) {
          await closeModal();
        }
      }
    "
  >
    <div class="flex flex-col items-center justify-start">
      <div v-if="partnerInfo?.hasPartnerLogo && !shouldShowUpgradeOnboarding">
        <ActivationPartnerLogo :partner-info="partnerInfo" />
      </div>

      <div class="flex w-full flex-col items-center">
        <component v-if="currentStepComponent" :is="currentStepComponent" v-bind="currentStepProps" />

        <div
          v-if="stepSaveState !== 'idle' || isCurrentStepSaved"
          class="text-muted-foreground mt-3 text-xs"
          role="status"
        >
          <span v-if="stepSaveState === 'saving'">Saving step...</span>
          <span v-else>Step saved.</span>
        </div>

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
