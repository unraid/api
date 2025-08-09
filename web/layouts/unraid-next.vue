<script setup lang="ts">
import { onMounted } from 'vue';

import { defaultColors } from '~/themes/default';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

// Initialize theme on mount
onMounted(() => {
  // Set a default theme similar to ColorSwitcherCe
  const whiteTheme = defaultColors.white;
  if (whiteTheme) {
    const defaultTheme = {
      banner: false,
      bannerGradient: false,
      descriptionShow: true,
      textColor: whiteTheme['--header-text-primary'],
      metaColor: whiteTheme['--header-text-secondary'],
      bgColor: whiteTheme['--header-background-color'],
      name: 'white',
    };
    themeStore.setTheme(defaultTheme);
  }
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
