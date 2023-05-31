<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
const serverStore = useServerStore();
const { state, stateData } = storeToRefs(serverStore);
</script>

<template>
  <template v-if="stateData.actions.includes('upgrade')">
    <button
      @click="console.log('TODO-UPGRADE_LINK')"
      class="link text-gamma"
      :title="'Upgrade'"
    >
      <h5>Unraid OS <em><strong>{{ stateData.humanReadable }}</strong></em></h5>
    </button>
  </template>
  <h5 v-else>
    Unraid OS <em :class="{ 'text-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ stateData.humanReadable }}</strong></em>
  </h5>

  <template v-if="stateData.actions.includes('purchase')">
    <button
      @click="console.log('TODO-PURCHASE_LINK')"
      class="link text-orange-dark ml-3"
      :title="'Purchase'"
    >{{ 'Purchase' }}</button>
  </template>
</template>


<style lang="postcss" scoped>
.link {
  @apply text-sm font-semibold transition-colors duration-150 ease-in-out border-t-0 border-l-0 border-r-0 border-b-2 border-transparent;
}

.link:hover,
.link:focus {
  /* @apply text-alpha; */
  @apply border-orange-dark;
}

.link:focus {
  @apply outline-none;
}
</style>