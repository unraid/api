<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { Select } from '@unraid/ui';

import type { Theme } from '~/themes/types';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();
const { theme } = storeToRefs(themeStore);

// Available theme options
const items = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'azure', label: 'Azure' },
  { value: 'gray', label: 'Gray' },
];

// Current theme value
const currentTheme = computed({
  get: () => theme.value.name,
  set: (value: string) => {
    const newTheme: Theme = {
      ...theme.value,
      name: value,
    };
    themeStore.setTheme(newTheme);
  },
});
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-sm font-medium text-white">Theme:</span>
    <Select v-model="currentTheme" :items="items" placeholder="Select theme" class="w-32" />
  </div>
</template>
