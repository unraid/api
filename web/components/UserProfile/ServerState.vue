<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from '~/composables/useI18n';

import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';

const { $gettext } = useI18n();

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
        :title="$gettext('Upgrade Key')"
        @click="upgradeAction.click?.()"
      >
        <h5>Unraid OS <em><strong>{{ $gettext(stateData.humanReadable) }}</strong></em></h5>
      </UpcServerStateBuy>
    </template>
    <h5 v-else>
      Unraid OS <em :class="{ 'text-unraid-red': stateData.error || state === 'EEXPIRED' }"><strong>{{ $gettext(stateData.humanReadable) }}</strong></em>
    </h5>

    <template v-if="purchaseAction">
      <UpcServerStateBuy
        class="text-orange-dark relative top-[1px] hidden sm:block"
        :title="$gettext('Purchase Key')"
        @click="purchaseAction.click?.()"
      >{{ $gettext('Purchase') }}</UpcServerStateBuy>
    </template>
  </span>
</template>
