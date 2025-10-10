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
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo, activationCode } = storeToRefs(useActivationCodeDataStore());
const purchaseStore = usePurchaseStore();

useThemeStore();

const hasActivationCode = computed(() => Boolean(activationCode.value?.code));

const currentStep = ref<'timezone' | 'plugins' | 'activation'>('timezone');

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
  if (currentStep.value === 'timezone') {
    return 2;
  }
  if (currentStep.value === 'plugins') {
    return 3;
  }
  return hasActivationCode.value ? 4 : 3;
});

const title = computed<string>(() => props.t("Let's activate your Unraid OS License"));
const description = computed<string>(() =>
  t('activation.activationModal.onTheFollowingScreenYourLicense')
);
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

const handleTimezoneComplete = () => {
  console.log('[ActivationModal] Timezone complete, moving to plugins');
  currentStep.value = 'plugins';
};

const handleTimezoneSkip = () => {
  currentStep.value = 'plugins';
};

const handlePluginsComplete = () => {
  if (hasActivationCode.value) {
    currentStep.value = 'activation';
  } else {
    modalStore.setIsHidden(true);
  }
};

const handlePluginsSkip = () => {
  if (hasActivationCode.value) {
    currentStep.value = 'activation';
  } else {
    modalStore.setIsHidden(true);
  }
};
</script>

<template>
  <Dialog
    v-if="isVisible"
    :model-value="isVisible"
    :show-footer="false"
    :show-close-button="isHidden === false"
    size="full"
    class="bg-background"
    @update:model-value="(value) => !value && modalStore.setIsHidden(true)"
  >
    <div class="flex flex-col items-center justify-start">
      <div v-if="partnerInfo?.hasPartnerLogo">
        <ActivationPartnerLogo :partner-info="partnerInfo" />
      </div>

      <div v-if="currentStep === 'timezone'" class="flex w-full flex-col items-center">
        <div class="mt-6 flex w-full flex-col gap-6">
          <ActivationSteps
            :active-step="activeStepNumber"
            :show-activation-step="hasActivationCode"
            class="mb-6"
          />

          <div class="my-12">
            <ActivationTimezoneStep
              :t="t"
              :on-complete="handleTimezoneComplete"
              :on-skip="handleTimezoneSkip"
              :show-skip="false"
            />
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 'plugins'" class="flex w-full flex-col items-center">
        <div class="mt-6 flex w-full flex-col gap-6">
          <ActivationSteps
            :active-step="activeStepNumber"
            :show-activation-step="hasActivationCode"
            class="mb-6"
          />

          <div class="my-12">
            <ActivationPluginsStep
              :t="t"
              :on-complete="handlePluginsComplete"
              :on-skip="handlePluginsSkip"
              :show-skip="hasActivationCode"
            />
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 'activation'" class="flex w-full flex-col items-center">
        <h1 class="mt-4 text-center text-xl font-semibold sm:text-2xl">{{ title }}</h1>

        <div class="mx-auto my-12 text-center sm:max-w-xl">
          <p class="text-center text-lg opacity-75 sm:text-xl">{{ description }}</p>
        </div>

        <div class="flex flex-col">
          <div class="mx-auto mb-10">
            <BrandButton
              :text="t('Activate Now')"
              :icon-right="ArrowTopRightOnSquareIcon"
              @click="purchaseStore.activate"
            />
          </div>

          <div class="mt-6 flex flex-col gap-6">
            <ActivationSteps
              :active-step="activeStepNumber"
              :show-activation-step="hasActivationCode"
              class="mb-6"
            />

            <div class="mx-auto flex w-full flex-col justify-center gap-4 sm:flex-row">
              <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
