<script lang="ts" setup>
import {
  BellAlertIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOsActions';

const props = defineProps<{
  releaseCheckTime: {
    formatted: string;
    relative: string;
  };
  t: any;
}>();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();

const { guid, keyfile, osVersion } = storeToRefs(serverStore);
const { available } = storeToRefs(updateOsStore);

const viewReleaseNotes = () => {
  // @ts-ignore – this is a global function provided by the webgui
  if (typeof openChanges === 'function') {
    // @ts-ignore
    openChanges(
      'showchanges /var/tmp/unRAIDServer.txt',
      props.t('{0} Release Notes', [osVersion.value]),
    );
  } else {
    alert('Unable to open release notes');
  }
};
</script>

<template>
  <div class="grid gap-y-16px">
    <h1 class="text-24px">{{ t('Update Unraid OS') }}</h1>
    <div class="flex flex-col md:flex-row gap-16px justify-start md:items-start md:justify-between">
      <div class="inline-flex gap-8px">
        <button
          @click="viewReleaseNotes"
          class="group"
          :title="t('View changelog for current version {0}', [osVersion])"
        >
          <UiBadge :icon="InformationCircleIcon">
            {{ t('Current Version {0}', [osVersion]) }}
          </UiBadge>
        </button>
        <UiBadge
          :color="available ? 'orange' : 'green'"
          :icon="available ? BellAlertIcon : CheckCircleIcon"
          :title="t('Last checked: {0}', [releaseCheckTime.relative])"
        >
          {{ available ? 'Update Available' : 'Up-to-date' }}
        </UiBadge>
      </div>

      <UpdateOsCheckButton :releaseCheckTime="releaseCheckTime" :t="t" />
    </div>
  </div>
</template>
