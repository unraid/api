<script lang="ts" setup>
import {
  ArrowSmallRightIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/solid';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import useTimeHelper from '~/composables/time';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{
  t: any;
}>();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText } = storeToRefs(updateOsActionsStore);

const { formatDate } = useTimeHelper(dateTimeFormat.value, props.t, true);

const availableWithRenewalRelease = computed(() => updateOsStore.findRelease('version', availableWithRenewal.value) ?? undefined);

const heading = computed((): string => {
  if (availableWithRenewal.value) {
    return props.t('Unraid OS {0} Released', [availableWithRenewal.value]);
  }
  return props.t('License Key Updates Expired');
});

// const subheading = computed(() => {
//   if (availableWithRenewal.value) {
//     return props.t('Your license key is not eligible for Unraid OS {0}', [availableWithRenewal.value]);
//   }
//   return '';
// });

const text = computed((): string => {
  const base = ineligibleText.value;
  if (available.value) {
    return `<p>${base}</p>
            <p>${props.t('You may still update to releases dated prior to your update expiration date.')}</p>`;
  }
  return base;
});

const updateButton = ref<UserProfileLink | undefined>();

watchEffect(() => {
  if (availableWithRenewal.value) {
    updateButton.value = updateOsActionsStore.initUpdateOsCallback();
  } else {
    updateButton.value = updateOsActionsStore.initUpdateOsCallback();
  }
});
</script>

<template>
  <UiCardWrapper :increased-padding="true" :warning="true">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-20px sm:gap-24px">
      <div class="grid gap-y-16px">
        <h3
          class="font-semibold leading-normal flex flex-row items-start justify-start gap-8px"
        >
          <ExclamationTriangleIcon class="w-20px shrink-0" />
          <span class="leading-none inline-flex flex-wrap justify-start items-baseline gap-8px">
            <span class="text-20px">
              {{ heading }}
            </span>
            <span
              v-if="availableWithRenewalRelease && availableWithRenewalRelease.date"
              class="text-16px opacity-75 shrink"
            >
              {{ formatDate(dayjs(availableWithRenewalRelease.date, 'YYYY-MM-DD').valueOf()) }}
            </span>
          </span>
        </h3>

        <h4 class="text-18px font-semibold italic">
          <RegistrationUpdateExpiration :t="t" />
        </h4>

        <div class="prose text-black text-16px leading-relaxed whitespace-normal" v-html="text" />
      </div>

      <div class="flex flex-col sm:flex-shrink-0 items-center gap-16px">
        <BrandButton
          btn-style="black"
          href="/Tools/Registration"
          :icon="WrenchScrewdriverIcon"
          :icon-right="ArrowSmallRightIcon"
          :text="t('Learn more and fix')"
          class="flex-none" />

        <BrandButton
          v-if="availableWithRenewal && updateButton"
          @click="updateButton?.click"
          btn-style="outline-black"
          :external="updateButton?.external"
          :icon="EyeIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :name="updateButton?.name"
          :text="t('View Changelog')"
          class="flex-none" />
      </div>
    </div>
  </UiCardWrapper>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
