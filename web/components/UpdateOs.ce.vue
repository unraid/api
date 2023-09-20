<script lang="ts" setup>
/**
 * @todo require keyfile to be set before allowing user to check for updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 * @todo detect downgrade possibility
 */
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue'
import { ArrowTopRightOnSquareIcon, BellAlertIcon } from '@heroicons/vue/24/solid';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { guid, keyfile, osVersion } = storeToRefs(serverStore);
const { available, cachedReleasesTimestamp } = storeToRefs(updateOsStore);

const includeNext = ref(false);

const updateButton = ref<UserProfileLink | undefined>();

const parsedCachedReleasesTimestamp = computed(() => {
  if (!cachedReleasesTimestamp.value) { return ''; }
  return dayjs(cachedReleasesTimestamp.value).format('YYYY-MM-DD HH:mm:ss');
});

const check = () => {
  updateOsStore.checkForUpdate({
    cache: true,
    guid: guid.value,
    includeNext: includeNext.value,
    keyfile: keyfile.value,
    osVersion: osVersion.value,
    skipCache: true,
  });
};

watchEffect(() => {
  if (available.value) {
    updateButton.value = updateOsActionsStore.initUpdateOsCallback();
  } else {
    updateButton.value = undefined;
  }
});
</script>

<template>
  <div class="grid gap-y-24px">
    <div class="grid gap-y-16px">
      <h1 class="text-24px">{{ t('Update Unraid OS') }}</h1>
      <p>Current Version: {{ osVersion }}</p>
      <p>Status: {{ available ? 'Update Available' : 'Up-to-date' }}</p>
    </div>

    <div class="text-16px text-alpha bg-beta text-left relative flex flex-col justify-around border-2 border-solid shadow-xl transform overflow-hidden rounded-lg transition-all sm:w-full">
      <div class="px-16px py-20px sm:p-24px">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-20px">
          <div class="grid gap-y-16px">
            <h3 class="text-20px font-semibold leading-6 text-gray-900 flex flex-row items-center gap-8px">
              <BellAlertIcon class="w-20px shrink-0" />
              <span>
                {{ available ? t(updateButton?.text ?? '', updateButton?.textParams) : t('Check for Updates')}}
              </span>
            </h3>
            <div class="max-w-xl text-sm text-gray-500 whitespace-normal">
              <p class="text-18px">{{ t('Receive the latest and greatest for Unraid OS. Whether it new features, security patches, or bug fixes – keeping your server up-to-date ensures the best experience that Unraid has to offer.') }}</p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-shrink-0 items-center gap-16px">
            <SwitchGroup v-if="!available" as="div">
              <div class="flex flex-shrink-0 items-center gap-16px">
                <Switch v-model="includeNext" :class="[includeNext ? 'bg-green-500' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2']">
                  <span :class="[includeNext ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
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
              <BrandButton
                v-if="available && updateButton"
                @click="updateButton?.click"
                :external="updateButton?.external"
                :icon-right="ArrowTopRightOnSquareIcon"
                :name="updateButton?.name"
                :text="t('View changelog & update')" />
              <BrandButton v-else @click="check" btn-style="outline" :text="t('Check Now')" />
              <span class="text-14px text-gamma text-center">{{ t('Last checked: {0}', [parsedCachedReleasesTimestamp]) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
