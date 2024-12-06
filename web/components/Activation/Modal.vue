<script lang="ts" setup>
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
    :title="`Activate your ${partnerName} powered by Unraid license!`"
    :description="'Blurb about how Unraid licensing works and that they will be prompted to create an Unraid.net account to activate their license.'"
    max-width="max-w-800px"
  >
    <!-- <template #main>
    </template> -->

    <template #footer>
      <div class="w-full flex gap-8px justify-center mx-auto">
        <BrandButton
          :text="'Activate Now'"
          @click="purchaseStore.activate"
        />
      </div>
    </template>
  </Modal>
</template>
