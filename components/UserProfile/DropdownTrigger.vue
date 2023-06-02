<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ChevronDownIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useServerStore } from '~/store/server';

export interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

defineEmits(['click']);

const {
  pluginInstalled,
  pluginOutdated,
  registered,
  state,
  stateData,
  username,
} = storeToRefs(useServerStore());

const registeredAndPluginInstalled = computed(() => {
  return pluginInstalled.value && registered.value;
});

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
  return props.open ? 'Close Dropdown' : 'Open Dropdown';
});
</script>

<template>
  <div class="relative flex items-center justify-end h-full">
    <button
      @click="$emit('click')"
      class="group text-18px hover:text-alpha focus:text-alpha border border-transparent flex flex-row justify-end items-center h-full gap-x-8px outline-none focus:outline-none"
      :title="title"
    >
      <InformationCircleIcon v-if="pluginOutdated" class="text-red fill-current relative w-24px h-24px" />
      <ExclamationTriangleIcon class="text-red fill-current relative w-24px h-24px" />

      <span class="flex flex-row items-center gap-x-8px">
        <span class="leading-none">{{ text }}</span>
        <UpcTriangleDown :open="open" />
      </span>

      <BrandAvatar />
    </button>
  </div>
</template>
