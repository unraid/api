<script lang="ts" setup>
import { computed } from 'vue';

import { Toaster } from '@unraid/ui';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

// Get dark mode from theme store
const theme = computed(() => (themeStore.darkMode ? 'dark' : 'light'));

withDefaults(
  defineProps<{
    position?:
      | 'top-center'
      | 'top-right'
      | 'top-left'
      | 'bottom-center'
      | 'bottom-right'
      | 'bottom-left';
  }>(),
  {
    position: 'top-right',
  }
);
</script>

<template>
  <Toaster rich-colors close-button :position="position" :theme="theme" />
</template>
