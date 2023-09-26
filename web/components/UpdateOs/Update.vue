<script lang="ts" setup>
/**
 * @todo require keyfile to be set before allowing user to check for updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 */
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
} from '@heroicons/vue/24/solid';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{
  t: any;
}>();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { guid, keyfile, osVersion } = storeToRefs(serverStore);
const { available } = storeToRefs(updateOsStore);

const updateButton = ref<UserProfileLink | undefined>();

const availableText = computed(() => {
  if (available.value && updateButton?.value?.text && updateButton?.value?.textParams) {
    return props.t(updateButton?.value.text, updateButton?.value.textParams);
  }
});

const ineligible = computed(() => !guid.value || !keyfile.value || !osVersion.value);

watchEffect(() => {
  if (available.value) {
    updateButton.value = updateOsActionsStore.initUpdateOsCallback();
  } else {
    updateButton.value = undefined;
  }
});
</script>

<template>
  <UiCardWrapper :increased-padding="true">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-20px sm:gap-24px">
      <div class="grid gap-y-16px">
        <h3 class="text-20px font-semibold leading-normal flex flex-row items-center gap-8px">
          <BellAlertIcon v-if="available" class="w-20px shrink-0" />
          <ArrowPathIcon v-else class="w-20px shrink-0" />
          <span>
            {{ availableText ? availableText : t('Check for Updates')}}
          </span>
        </h3>
        <div class="text-16px leading-relaxed whitespace-normal opacity-75">
          <p v-if="ineligible">{{ t('A valid keyfile and USB Flash boot device are required to check for updates.') }} {{ t('Please fix any errors and try again.') }}</p>
          <p v-else>{{ t('Receive the latest and greatest for Unraid OS. Whether it new features, security patches, or bug fixes – keeping your server up-to-date ensures the best experience that Unraid has to offer.') }}</p>
        </div>
      </div>

      <BrandButton
        v-if="ineligible"
        href="/Tools/Registration"
        :text="t('Go to Tools > Registration')"
        />
      <BrandButton
        v-else-if="available && updateButton"
        @click="updateButton?.click"
        :external="updateButton?.external"
        :icon-right="ArrowTopRightOnSquareIcon"
        :name="updateButton?.name"
        :text="t('View changelog & update')" />
    </div>
  </UiCardWrapper>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
