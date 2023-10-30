<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { onBeforeMount } from 'vue';

import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

defineProps<{
  t: any;
}>();

const updateOsActionsStore = useUpdateOsActionsStore();

const { rebootType } = storeToRefs(updateOsActionsStore);

onBeforeMount(() => {
  // On /Tools/Update automatically send the user to account.unraid.net/server/update-os when we're not prompting for reboot
  if (window.location.pathname === WEBGUI_TOOLS_UPDATE.pathname && rebootType.value === '') {
    updateOsActionsStore.executeUpdateOsCallback();
  }
});
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
