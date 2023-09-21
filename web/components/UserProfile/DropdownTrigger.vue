<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  Bars3Icon,
  Bars3BottomRightIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';

import { useDropdownStore } from '~/store/dropdown';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOsActions';

const props = defineProps<{ t: any; }>();

const dropdownStore = useDropdownStore();
const { dropdownVisible } = storeToRefs(dropdownStore);
const { errors } = storeToRefs(useErrorsStore());
const { state, stateData } = storeToRefs(useServerStore());
const { available: osUpdateAvailable } = storeToRefs(useUpdateOsStore());

const showErrorIcon = computed(() => errors.value.length || stateData.value.error);

const text = computed((): string | undefined => {
  if ((stateData.value.error) && state.value !== 'EEXPIRED') { return props.t('Fix Error'); }
});

const title = computed((): string => {
  if (state.value === 'ENOKEYFILE') { return props.t('Get Started'); }
  if (state.value === 'EEXPIRED') { return props.t('Trial Expired, see options below'); }
  if (showErrorIcon.value) { return props.t('Learn more about the error'); }
  return dropdownVisible.value ? props.t('Close Dropdown') : props.t('Open Dropdown');
});
</script>

<template>
  <button
    class="group text-18px border-0 relative flex flex-row justify-end items-center h-full gap-x-8px opacity-100 hover:opacity-75 focus:opacity-75 hover:text-alpha focus:text-alpha transition-opacity"
    :title="title"
    @click="dropdownStore.dropdownToggle()"
  >
    <template v-if="errors.length && errors[0].level">
      <InformationCircleIcon v-if="errors[0].level === 'info'" class="text-unraid-red fill-current relative w-24px h-24px" />
      <ExclamationTriangleIcon v-if="errors[0].level === 'warning'" class="text-unraid-red fill-current relative w-24px h-24px" />
      <ShieldExclamationIcon v-if="errors[0].level === 'error'" class="text-unraid-red fill-current relative w-24px h-24px" />
    </template>
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span class="absolute bottom-[-3px] inset-x-0 h-2px w-full bg-gradient-to-r from-unraid-red to-orange rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" />
    </span>

    <BellAlertIcon v-if="osUpdateAvailable" class="hover:animate-pulse text-white fill-current relative w-16px h-16px" />

    <Bars3Icon v-if="!dropdownVisible" class="w-20px" />
    <Bars3BottomRightIcon v-else class="w-20px" />

    <span class="relative">
      <BrandAvatar />
      <!-- <span v-if="osUpdateAvailable" class="absolute z-10 -bottom-1 -right-3 w-24px h-24px flex items-center justify-center shadow border border-white bg-gradient-to-r from-unraid-red to-orange rounded-full">
        <BellAlertIcon class="hover:animate-pulse text-white fill-current relative w-12px h-12px" />
      </span> -->
    </span>
  </button>
</template>
