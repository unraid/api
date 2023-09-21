<script lang="ts" setup>
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { osVersion } = storeToRefs(serverStore);
const { available, parsedReleaseTimestamp } = storeToRefs(updateOsStore);
const { rebootType } = storeToRefs(updateOsActionsStore);
</script>

<template>
  <div class="flex flex-row justify-center gap-x-8px">
    <button
      @click="updateOsActionsStore.viewCurrentReleaseNotes(t('{0} Release Notes', [osVersion]))"
      class="group"
      :title="t('View release notes')"
    >
      <UiBadge
        color="custom"
        :icon="InformationCircleIcon"
        icon-styles="text-gamma"
        size="12px"
        class="text-gamma group-hover:text-orange-dark group-focus:text-orange-dark group-hover:underline group-focus:underline"
      >
        {{ osVersion }}
      </UiBadge>
    </button>

    <a href="/Tools/Update" class="group" :title="t('Go to Tools > Update')">
      <UiBadge
        v-if="available && rebootType === 'none'"
        color="orange"
        :icon="BellAlertIcon"
        size="12px"
      >
        {{ t('Update Available') }}
      </UiBadge>
      <UiBadge
        v-else-if="rebootType !== 'none'"
        :color="'yellow'"
        :icon="ExclamationTriangleIcon"
        size="12px"
      >
        {{ rebootType === 'downgrade' ? t('Reboot Required for Downgrade') : t('Reboot Required for Update') }}
      </UiBadge>
    </a>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
