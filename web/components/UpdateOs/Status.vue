<script lang="ts" setup>
import {
  ArrowPathIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  restoreVersion?: string | undefined; 
  t: any;
}
const props = withDefaults(defineProps<Props>(), {
  restoreVersion: undefined,
});

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { guid, keyfile, osVersion } = storeToRefs(serverStore);
const { available, parsedReleaseTimestamp } = storeToRefs(updateOsStore);
const { rebootType, rebootTypeText } = storeToRefs(updateOsActionsStore);
</script>

<template>
  <div class="grid gap-y-16px">
    <h1 class="text-24px">{{ t('Update Unraid OS') }}</h1>
    <div class="flex flex-col md:flex-row gap-16px justify-start md:items-start md:justify-between">
      <div class="inline-flex flex-wrap justify-center gap-8px">
        <button
          @click="updateOsActionsStore.viewCurrentReleaseNotes(t('{0} Release Notes', [osVersion]))"
          class="group"
          :title="t('View release notes')"
        >
          <UiBadge :icon="InformationCircleIcon" class="underline">
            {{ t('Current Version {0}', [osVersion]) }}
          </UiBadge>
        </button>

        <UiBadge
          v-if="!guid || !keyfile"
          :color="'red'"
          :icon="ExclamationTriangleIcon"
          :title="t('A valid keyfile and USB Flash boot device are required to check for updates.')"
        >
          {{ t('Unable to check for updates') }}
        </UiBadge>
        <UiBadge
          v-else-if="rebootType === ''"
          :color="available ? 'orange' : 'green'"
          :icon="available ? BellAlertIcon : CheckCircleIcon"
          :title="parsedReleaseTimestamp ? t('Last checked: {0}', [parsedReleaseTimestamp.relative]) : ''"
        >
          {{ available ? t('Update Available') : t('Up-to-date') }}
        </UiBadge>
        <UiBadge
          v-else
          :color="'yellow'"
          :icon="ExclamationTriangleIcon"
        >
          {{ t(rebootTypeText) }}
        </UiBadge>
      </div>

      <div>
        <UpdateOsCheckButton
          v-if="rebootType === ''"
          :t="t" />
        <BrandButton
          v-else-if="rebootType === 'downgrade' || rebootType === 'upgrade'"
          @click="updateOsActionsStore.rebootServer()"
          :icon="ArrowPathIcon"
          :text="rebootType === 'downgrade' ? t('Reboot Now to Downgrade') : t('Reboot Now to Update')" />
      </div>
    </div>
  </div>
</template>
