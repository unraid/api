<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';

const dropdownStore = useDropdownStore();
const { dropdownVisible } = storeToRefs(dropdownStore);
const {
  pluginInstalled,
  pluginOutdated,
  registered,
  state,
  stateData,
  username,
} = storeToRefs(useServerStore());

const registeredAndPluginInstalled = computed(() => pluginInstalled.value && registered.value);
const showErrorIcon = computed(() => stateData.value.error);

const text = computed((): string | undefined => {
  if ((stateData.value.error) && state.value !== 'EEXPIRED') return 'Fix Error';
  if (registeredAndPluginInstalled.value) return username.value;
  return;
});

const title = computed((): string => {
  if (state.value === 'ENOKEYFILE') return 'Get Started';
  if (state.value === 'EEXPIRED') return 'Trial Expired, see options below';
  if (stateData.value.error) return 'Learn More';
  // if (cloud.value && cloud.value.error) return 'Unraid API Error';
  // if (myServersError.value && registeredAndPluginInstalled.value return 'Unraid API Error';
  // if (errorTooManyDisks.value) return 'Too many devices';
  // if (isLaunchpadOpen.value) return 'Close and continue to webGUI';
  return dropdownVisible.value ? 'Close Dropdown' : 'Open Dropdown';
});
</script>

<template>
  <button
    @click="dropdownStore.dropdownToggle()"
    class="group text-18px hover:text-alpha focus:text-alpha border border-transparent relative flex flex-row justify-end items-center h-full gap-x-8px outline-none focus:outline-none"
    :title="title"
  >
    <InformationCircleIcon v-if="pluginOutdated" class="text-unraid-red fill-current relative w-24px h-24px" />
    <ExclamationTriangleIcon v-else-if="showErrorIcon" class="text-unraid-red fill-current relative w-24px h-24px" />
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span class="absolute bottom-[-3px] inset-x-0 h-2px w-full bg-gradient-to-r from-unraid-red to-orange rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"></span>
    </span>
    <UpcDropdownTriggerMenuIcon :open="dropdownVisible" />
    <BrandAvatar />
  </button>
</template>
