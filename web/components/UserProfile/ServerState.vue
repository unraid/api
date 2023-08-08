<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';

defineProps<{ t: any; }>();

const { state, stateData } = storeToRefs(useServerStore());

const purchaseAction = computed((): ServerStateDataAction | undefined => {
  return stateData.value.actions && stateData.value.actions.find(action => action.name === 'purchase');
});
const upgradeAction = computed((): ServerStateDataAction | undefined => {
  return stateData.value.actions && stateData.value.actions.find(action => action.name === 'upgrade');
});
</script>

<template>
  <span class="flex flex-row items-center gap-x-8px">
    <template v-if="upgradeAction">
      <UpcServerStateBuy
        class="text-gamma"
        :title="t('Upgrade Key')"
        @click="upgradeAction.click()"
      >
        <h5>Unraid OS <em><strong>{{ t(stateData.humanReadable) }}</strong></em></h5>
      </UpcServerStateBuy>
    </template>
    <h5 v-else>
      Unraid OS <em :class="{ 'text-unraid-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ t(stateData.humanReadable) }}</strong></em>
    </h5>

    <template v-if="purchaseAction">
      <UpcServerStateBuy
        class="text-orange-dark relative top-[1px] hidden sm:block"
        :title="t('Purchase Key')"
        @click="purchaseAction.click()"
      >{{ t('Purchase') }}</UpcServerStateBuy>
    </template>
  </span>
</template>
