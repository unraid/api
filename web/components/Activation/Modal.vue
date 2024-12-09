<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useActivationCodeStore } from '~/store/activationCode';
import { usePurchaseStore } from '~/store/purchase';
import type { ButtonProps } from '~/types/ui/button';

export interface Props {
  t: ComposerTranslation;
}

defineProps<Props>();

const { partnerName, showModal } = storeToRefs(useActivationCodeStore());
const purchaseStore = usePurchaseStore();

const title = computed<string>(() => partnerName.value ? `Welcome to your new ${partnerName.value} system, powered by Unraid!` : 'Welcome to Unraid!');
const description = computed<string>(() => `To get started, let's activate your license and create an unraid.net account to provide access to account features like key management and support.`);
const docsButtons = computed<ButtonProps[]>(() => {
  return [
    {
      btnStyle: 'underline',
      external: true,
      href: 'https://docs.unraid.net/unraid-os/faq/licensing-faq/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: 'More about Licensing',
    },
    {
      btnStyle: 'underline',
      external: true,
      href: 'https://docs.unraid.net/account/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: '14px',
      text: 'More about Unraid.net Accounts',
    },
  ];
});
</script>

<template>
  <Modal
    v-if="showModal"
    :t="t"
    :open="showModal"
    :show-close-x="false"
    :title="title"
    :title-in-main="true"
    :description="description"
    max-width="max-w-640px"
  >
    <template #header>
      <img src="https://placehold.co/300x100/004225/white?text=Gridstack+powered+by+Unraid" class="max-w-[175px]">
    </template>
    <template #main>
      <div class="flex justify-center gap-4 mx-auto w-full">
        <BrandButton
          v-for="button in docsButtons"
          :key="button.text"
          v-bind="button"
        />
      </div>
    </template>
    <template #footer>
      <div class="w-full flex gap-8px justify-center mx-auto">
        <BrandButton
          :text="'Activate Now'"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.activate"
        />
      </div>
    </template>
  </Modal>
</template>
