<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

import { useUpdateOsActionsStore } from '~/store/updateOsActions';

defineProps<{
  t: any;
}>();

const updateOsActionsStore = useUpdateOsActionsStore();
</script>

<template>
  <div class="flex flex-col sm:flex-shrink-0 sm:flex-grow-0 items-center">
    <BrandButton
      :icon="ArrowPathIcon"
      :icon-right="ArrowTopRightOnSquareIcon"
      :text="t('Check for OS Updates')"
      class="flex-0"
      @click="updateOsActionsStore.executeUpdateOsCallback()"
    />
  </div>
</template>
