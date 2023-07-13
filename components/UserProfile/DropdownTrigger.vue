<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InformationCircleIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { useDropdownStore } from '~/store/dropdown';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

const dropdownStore = useDropdownStore();
const { dropdownVisible } = storeToRefs(dropdownStore);
const { errors } = storeToRefs(useErrorsStore());
const {
  connectPluginInstalled,
  registered,
  state,
  stateData,
  username,
} = storeToRefs(useServerStore());

const registeredAndconnectPluginInstalled = computed(() => connectPluginInstalled.value && registered.value);
const showErrorIcon = computed(() => errors.value.length || stateData.value.error);

const text = computed((): string | undefined => {
  if ((stateData.value.error) && state.value !== 'EEXPIRED') return 'Fix Error';
  if (registeredAndconnectPluginInstalled.value) return username.value;
  return;
});

const title = computed((): string => {
  if (state.value === 'ENOKEYFILE') return 'Get Started';
  if (state.value === 'EEXPIRED') return 'Trial Expired, see options below';
  if (showErrorIcon.value) return 'Learn more about the error';
  return dropdownVisible.value ? 'Close Dropdown' : 'Open Dropdown';
});
</script>

<template>
  <button
    @click="dropdownStore.dropdownToggle()"
    class="group text-18px hover:text-alpha focus:text-alpha border border-transparent relative flex flex-row justify-end items-center h-full gap-x-8px outline-none focus:outline-none"
    :title="title"
  >
    <template v-if="errors.length && errors[0].level">
      <InformationCircleIcon v-if="errors[0].level === 'info'" class="text-unraid-red fill-current relative w-24px h-24px" />
      <ExclamationTriangleIcon v-if="errors[0].level === 'warning'" class="text-unraid-red fill-current relative w-24px h-24px" />
      <ShieldExclamationIcon v-if="errors[0].level === 'error'" class="text-unraid-red fill-current relative w-24px h-24px" />
    </template>
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span class="absolute bottom-[-3px] inset-x-0 h-2px w-full bg-gradient-to-r from-unraid-red to-orange rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"></span>
    </span>
    <UpcDropdownTriggerMenuIcon :open="dropdownVisible" />
    <BrandAvatar />
  </button>
</template>
