<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Dialog } from '@unraid/ui';
import { DOCS_URL_ACCOUNT, DOCS_URL_LICENSING_FAQ } from '~/consts';

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
      href: DOCS_URL_LICENSING_FAQ,
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: props.t('More about Licensing'),
    },
    {
      variant: 'underline',
      external: true,
      href: DOCS_URL_ACCOUNT,
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
        <ActivationPartnerLogo :partner-info="partnerInfo" />
      </div>

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
          <ActivationSteps :active-step="2" class="mb-6" />

          <div class="mx-auto flex w-full flex-col justify-center gap-4 sm:flex-row">
            <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
