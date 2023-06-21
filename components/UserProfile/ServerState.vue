<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';

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
        @click="upgradeAction.click()"
        class="text-gamma"
        :title="'Upgrade'"
      >
        <h5>Unraid OS <em><strong>{{ stateData.humanReadable }}</strong></em></h5>
      </UpcServerStateBuy>
    </template>
    <h5 v-else>
      Unraid OS <em :class="{ 'text-unraid-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ stateData.humanReadable }}</strong></em>
    </h5>

    <template v-if="purchaseAction">
      <UpcServerStateBuy
        @click="purchaseAction.click()"
        class="text-orange-dark relative top-[1px]"
        :title="'Purchase'"
      >{{ 'Purchase' }}</UpcServerStateBuy>
    </template>
  </span>
</template>
