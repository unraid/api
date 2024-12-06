<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useOemStore } from '~/store/oem';

export interface Props {
  t: ComposerTranslation;
}

defineProps<Props>();

const { oemName, showActivationModal } = storeToRefs(useOemStore());
</script>

<template>
  <Modal
    v-if="showActivationModal"
    :t="t"
    :open="showActivationModal"
    :show-close-x="false"
    :title="`Activate your ${oemName} powered by Unraid license!`"
    :description="'Blurb about how Unraid licensing works and that they will be prompted to create an Unraid.net account to activate their license.'"
    max-width="max-w-800px"
  >
    <!-- <template #main>
    </template> -->

    <template #footer>
      <div class="w-full flex gap-8px justify-center mx-auto">
        <BrandButton
          :text="'Activate Now'"
          @click="console.log('Activate Now')"
        />
      </div>
    </template>
  </Modal>
</template>
