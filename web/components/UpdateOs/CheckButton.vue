<script setup lang="ts">
  /**
 * @todo require keyfile to be set before allowing user to check for updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 * @todo detect downgrade possibility
 */
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';
import { stat } from 'fs';

const props = defineProps<{
  releaseCheckTime: {
    formatted: string;
    relative: string;
  };
  t: any;
}>();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { guid, keyfile, osVersion } = storeToRefs(serverStore);
const { available } = storeToRefs(updateOsStore);

const includeNext = ref(false);

const status = ref<'ready' | 'checking'>('ready');

const buttonText = computed(() => {
  if (status.value === 'checking') {
    return props.t('Checking...');
  }
  return props.t('Check For Updates');
});

const check = async () => {
  status.value = 'checking';

  await updateOsStore.checkForUpdate({
    cache: true,
    guid: guid.value,
    includeNext: includeNext.value,
    keyfile: keyfile.value,
    osVersion: osVersion.value,
    skipCache: true,
  }).finally(() => {
    status.value = 'ready';
  })
};
</script>

<template>
  <div class="flex flex-col sm:flex-shrink-0 items-center gap-16px">
    <SwitchGroup as="div">
      <div class="flex flex-shrink-0 items-center gap-16px">
        <Switch v-model="includeNext" :class="[includeNext ? 'bg-green-500' : 'bg-gray-200', 'relative inline-flex h-24px w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2']">
          <span :class="[includeNext ? 'translate-x-20px' : 'translate-x-0', 'pointer-events-none relative inline-block h-20px w-20px transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
            <span :class="[includeNext ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
              <svg class="h-12px w-12px text-gray-400" fill="none" viewBox="0 0 12 12">
                <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span :class="[includeNext ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
              <svg class="h-12px w-12px text-green-500" fill="currentColor" viewBox="0 0 12 12">
                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
              </svg>
            </span>
          </span>
        </Switch>
        <SwitchLabel class="text-14px">{{ t('Include Prereleases') }}</SwitchLabel>
      </div>
    </SwitchGroup>
    <span class="flex flex-col gap-y-8px">
      <BrandButton @click="check" :disabled="status === 'checking'" btn-style="outline" :text="buttonText" class="flex-0" />
      <span class="text-14px opacity-75 text-center" :title="releaseCheckTime.formatted">{{ t('Last checked: {0}', [releaseCheckTime.relative]) }}</span>
    </span>
  </div>
</template>
