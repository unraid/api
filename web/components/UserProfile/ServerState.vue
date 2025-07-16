<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';
import UpcServerStateBuy from './ServerStateBuy.vue';

defineProps<{ t: ComposerTranslation; }>();

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
        class="text-header-text-secondary"
        :title="t('Upgrade Key')"
        @click="upgradeAction.click?.()"
      >
        <h5>Unraid OS <em><strong>{{ t(stateData.humanReadable) }}</strong></em></h5>
      </UpcServerStateBuy>
    </template>
    <h5 v-else>
      Unraid OS <em :class="{ 'text-unraid-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ t(stateData.humanReadable) }}</strong></em>
    </h5>

    <template v-if="purchaseAction">
      <UpcServerStateBuy
        class="text-orange-dark relative top-px hidden sm:block"
        :title="t('Purchase Key')"
        @click="purchaseAction.click?.()"
      >{{ t('Purchase') }}</UpcServerStateBuy>
    </template>
  </span>
</template>
