<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { CardWrapper } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useUpdateOsActionsStore } from '~/store/updateOsActions';

defineProps<{
  t: ComposerTranslation;
}>();

const { rebootTypeText } = storeToRefs(useUpdateOsActionsStore());
</script>

<template>
  <CardWrapper :increased-padding="true">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-5 sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="text-xl font-semibold leading-normal flex flex-row items-center gap-2">
          <ExclamationTriangleIcon class="w-5 shrink-0" />
          {{ t(rebootTypeText) }}
        </h3>
        <div class="text-base leading-relaxed opacity-75 whitespace-normal">
          <p>
            {{
              t(
                'During the Unraid OS update process third-party drivers were detected and are currently being updated in the background. Please wait for those to finish downloading before rebooting your server to complete the update process. You should receive a system notification when complete. You may also refresh this page to check for an updated status.'
              )
            }}
          </p>
        </div>
      </div>
    </div>
  </CardWrapper>
</template>
