<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Dialog } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const modalStore = useActivationCodeModalStore();
const { isVisible, isHidden } = storeToRefs(modalStore);
const { partnerInfo } = storeToRefs(useActivationCodeDataStore());
const purchaseStore = usePurchaseStore();

useThemeStore();

const title = computed<string>(() => props.t("Let's activate your Unraid OS License"));
const description = computed<string>(() =>
  props.t(
    `On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward.`
  )
);
const docsButtons = computed<BrandButtonProps[]>(() => {
  return [
    {
      variant: 'underline',
      external: true,
      href: 'https://docs.unraid.net/unraid-os/faq/licensing-faq/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: props.t('More about Licensing'),
    },
    {
      variant: 'underline',
      external: true,
      href: 'https://docs.unraid.net/account/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: props.t('More about Unraid.net Accounts'),
    },
  ];
});
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
        <ActivationPartnerLogo :name="partnerInfo.partnerName" />
      </div>

      <h1 class="text-center text-xl sm:text-2xl font-semibold mt-4">{{ title }}</h1>

      <div class="sm:max-w-xl mx-auto my-12 text-center">
        <p class="text-lg sm:text-xl opacity-75 text-center">{{ description }}</p>
      </div>

      <div class="flex flex-col">
        <div class="mx-auto mb-10">
          <BrandButton
            :text="t('Activate Now')"
            :icon-right="ArrowTopRightOnSquareIcon"
            @click="purchaseStore.activate"
          />
        </div>

        <div class="flex flex-col gap-6 mt-6">
          <ActivationSteps :active-step="2" class="mb-6" />

          <div class="flex flex-col sm:flex-row justify-center gap-4 mx-auto w-full">
            <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
