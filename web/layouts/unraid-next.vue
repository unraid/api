<script setup lang="ts">
import { onMounted } from 'vue';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

// Initialize theme when component mounts
onMounted(async () => {
  await themeStore.setTheme();
  themeStore.setCssVars();
});
</script>

<template>
  <UPage>
    <slot />
  </UPage>
</template>

<style>
/* Import theme styles */
@import '~/assets/main.css';
</style>
