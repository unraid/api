<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';
import UpcServerStateBuy from './ServerStateBuy.vue';

const { t } = useI18n();

const { state, stateData } = storeToRefs(useServerStore());

const purchaseAction = computed((): ServerStateDataAction | undefined => {
  return stateData.value.actions && stateData.value.actions.find(action => action.name === 'purchase');
});
const upgradeAction = computed((): ServerStateDataAction | undefined => {
  return stateData.value.actions && stateData.value.actions.find(action => action.name === 'upgrade');
});
</script>

<template>
  <span class="flex flex-row items-center gap-x-2">
    <template v-if="upgradeAction">
      <UpcServerStateBuy
        class="text-header-text-secondary"
        :title="t('Upgrade Key')"
        @click="upgradeAction.click?.()"
      >
        <span class="font-semibold">Unraid OS <em><strong>{{ t(stateData.humanReadable) }}</strong></em></span>
      </UpcServerStateBuy>
    </template>
    <span v-else class="font-semibold">
      Unraid OS <em :class="{ 'text-unraid-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ t(stateData.humanReadable) }}</strong></em>
    </span>

    <template v-if="purchaseAction">
      <UpcServerStateBuy
        class="text-orange-dark relative top-px hidden sm:!block"
        :title="t('Purchase Key')"
        @click="purchaseAction.click?.()"
      >{{ t('Purchase') }}</UpcServerStateBuy>
    </template>
  </span>
</template>
