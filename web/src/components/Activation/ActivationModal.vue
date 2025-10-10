<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Dialog } from '@unraid/ui';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/consts';

import type { BrandButtonProps } from '@unraid/ui';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationPluginsStep from '~/components/Activation/ActivationPluginsStep.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import ActivationTimezoneStep from '~/components/Activation/ActivationTimezoneStep.vue';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo, activationCode, isFreshInstall } = storeToRefs(useActivationCodeDataStore());
const upgradeStore = useUpgradeOnboardingStore();
const { shouldShowUpgradeOnboarding, upgradeSteps, currentVersion, previousVersion } =
  storeToRefs(upgradeStore);
const purchaseStore = usePurchaseStore();

useThemeStore();

const hasActivationCode = computed(() => Boolean(activationCode.value?.code));

const isUpgradeMode = computed(() => !isFreshInstall.value && shouldShowUpgradeOnboarding.value);

const showModal = computed(() => isVisible.value || shouldShowUpgradeOnboarding.value);

const availableSteps = computed(() => {
  if (isUpgradeMode.value) {
    return upgradeSteps.value.map((step) => step.id);
  }
  return ['timezone', 'plugins'];
});

const currentStepIndex = ref(0);

const currentStep = computed(() => {
  if (currentStepIndex.value < availableSteps.value.length) {
    return availableSteps.value[currentStepIndex.value];
  }
  return hasActivationCode.value && !isUpgradeMode.value ? 'activation' : null;
});

if (import.meta.env.DEV) {
  console.log('[ActivationModal] Initial step:', currentStep.value);
  console.log('[ActivationModal] Has activation code:', hasActivationCode.value);
  console.log('[ActivationModal] Is visible:', isVisible.value);

  interface ActivationModalDebug {
    currentStep: typeof currentStep;
    hasActivationCode: typeof hasActivationCode;
    isVisible: typeof isVisible;
  }

  (window as Window & { __activationModalDebug?: ActivationModalDebug }).__activationModalDebug = {
    currentStep,
    hasActivationCode,
    isVisible,
  };
}

const activeStepNumber = computed(() => {
  if (isUpgradeMode.value) {
    return currentStepIndex.value + 1;
  }
  if (currentStep.value === 'timezone') {
    return 2;
  }
  if (currentStep.value === 'plugins') {
    return 3;
  }
  return hasActivationCode.value ? 4 : 3;
});

const modalTitle = computed<string>(() => {
  if (isUpgradeMode.value) {
    return t('Welcome to Unraid {version}!', { version: currentVersion.value });
  }
  return t("Let's activate your Unraid OS License");
});

const modalDescription = computed<string>(() => {
  if (isUpgradeMode.value) {
    return t("You've upgraded from {prev} to {curr}", {
      prev: previousVersion.value,
      curr: currentVersion.value,
    });
  }
  return t(
    `On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward.`
  );
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
  if (isUpgradeMode.value) {
    upgradeStore.setIsHidden(true);
  } else {
    modalStore.setIsHidden(true);
  }
};

const goToNextStep = () => {
  if (currentStepIndex.value < availableSteps.value.length - 1) {
    currentStepIndex.value++;
  } else if (hasActivationCode.value && !isUpgradeMode.value) {
    currentStepIndex.value = availableSteps.value.length;
  } else {
    closeModal();
  }
};

const goToPreviousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
};

const canGoBack = computed(() => currentStepIndex.value > 0);

const handleTimezoneComplete = () => {
  console.log('[ActivationModal] Timezone complete, moving to next step');
  goToNextStep();
};

const handleTimezoneSkip = () => {
  goToNextStep();
};

const handlePluginsComplete = () => {
  goToNextStep();
};

const handlePluginsSkip = () => {
  goToNextStep();
};

const currentStepConfig = computed(() => {
  if (!isUpgradeMode.value) {
    return null;
  }
  return upgradeSteps.value[currentStepIndex.value];
});
</script>

<template>
  <Dialog
    v-if="showModal"
    :model-value="showModal"
    :show-footer="false"
    :show-close-button="isHidden === false || isUpgradeMode"
    size="full"
    class="bg-background"
    @update:model-value="(value) => !value && closeModal()"
  >
    <div class="flex flex-col items-center justify-start">
      <div v-if="partnerInfo?.hasPartnerLogo && !isUpgradeMode">
        <ActivationPartnerLogo :partner-info="partnerInfo" />
      </div>

      <div v-if="isUpgradeMode" class="mt-6 mb-8 text-center">
        <h1 class="text-2xl font-semibold">{{ modalTitle }}</h1>
        <p class="mt-2 text-sm opacity-75">{{ modalDescription }}</p>
      </div>

      <div v-if="currentStep === 'timezone'" class="flex w-full flex-col items-center">
        <div class="mt-6 flex w-full flex-col gap-6">
          <div class="my-12">
            <ActivationTimezoneStep
              :t="t"
              :on-complete="handleTimezoneComplete"
              :on-skip="handleTimezoneSkip"
              :on-back="goToPreviousStep"
              :show-skip="isUpgradeMode ? !currentStepConfig?.required : false"
              :show-back="canGoBack"
            />
          </div>

          <ActivationSteps
            v-if="!isUpgradeMode"
            :active-step="activeStepNumber"
            :show-activation-step="hasActivationCode"
            class="mt-6"
          />
        </div>
      </div>

      <div v-else-if="currentStep === 'plugins'" class="flex w-full flex-col items-center">
        <div class="mt-6 flex w-full flex-col gap-6">
          <div class="my-12">
            <ActivationPluginsStep
              :t="t"
              :on-complete="handlePluginsComplete"
              :on-skip="handlePluginsSkip"
              :on-back="goToPreviousStep"
              :show-skip="isUpgradeMode ? !currentStepConfig?.required : hasActivationCode"
              :show-back="canGoBack"
            />
          </div>

          <ActivationSteps
            v-if="!isUpgradeMode"
            :active-step="activeStepNumber"
            :show-activation-step="hasActivationCode"
            class="mt-6"
          />
        </div>
      </div>

      <div v-else-if="currentStep === 'activation'" class="flex w-full flex-col items-center">
        <h1 class="mt-4 text-center text-xl font-semibold sm:text-2xl">{{ modalTitle }}</h1>

        <div class="mx-auto my-12 text-center sm:max-w-xl">
          <p class="text-center text-lg opacity-75 sm:text-xl">{{ modalDescription }}</p>
        </div>

        <div class="flex flex-col">
          <div class="mx-auto mb-10 flex gap-4">
            <BrandButton
              v-if="canGoBack"
              :text="t('Back')"
              variant="outline"
              @click="goToPreviousStep"
            />
            <BrandButton
              :text="t('Activate Now')"
              :icon-right="ArrowTopRightOnSquareIcon"
              @click="purchaseStore.activate"
            />
          </div>

          <div class="mt-6 flex flex-col gap-6">
            <div class="mx-auto flex w-full flex-col justify-center gap-4 sm:flex-row">
              <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
            </div>

            <ActivationSteps
              :active-step="activeStepNumber"
              :show-activation-step="hasActivationCode"
              class="mt-6"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
