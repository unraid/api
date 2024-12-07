<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useActivationCodeStore } from '~/store/activationCode';
import { usePurchaseStore } from '~/store/purchase';

export interface Props {
  t: ComposerTranslation;
}

defineProps<Props>();

const { partnerName, showModal } = storeToRefs(useActivationCodeStore());
const purchaseStore = usePurchaseStore();
</script>

<template>
  <Modal
    v-if="showModal"
    :t="t"
    :open="showModal"
    :show-close-x="false"
    :title="partnerName ? `Activate your ${partnerName} powered by Unraid license` : 'Activate your Unraid license'"
    :title-in-main="true"
    :description="'Blurb about how Unraid licensing works and that they will be prompted to create an Unraid.net account to activate their license.'"
    max-width="max-w-800px"
  >
    <template #header>
      <img src="https://placehold.co/300x100/004225/white?text=Gridstack+powered+by+Unraid" class="max-w-[175px]">
    </template>
    <template #main>
      <div class="flex justify-center mx-auto w-full">
        <BrandButton
          :text="'More about Licensing'"
          :icon-right="ArrowTopRightOnSquareIcon"
          btn-style="underline"
          size="14px"
          href="https://docs.unraid.net"
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
