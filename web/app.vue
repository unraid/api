<script lang="ts" setup>
import { onMounted } from 'vue';

import { NuxtLayout, NuxtPage, UApp  } from '#components';
import { devConfig } from '~/helpers/env';

onMounted(() => {
  document.documentElement.setAttribute('data-env', devConfig.NODE_ENV || 'production');

  // Override text sizes back to 16px base in dev mode (from 10px base in index.css)
  if (devConfig.NODE_ENV === 'development') {
    document.documentElement.style.setProperty('--text-xs', '0.75rem'); /* 12px */
    document.documentElement.style.setProperty('--text-sm', '0.875rem'); /* 14px */
    document.documentElement.style.setProperty('--text-base', '1rem'); /* 16px */
    document.documentElement.style.setProperty('--text-lg', '1.125rem'); /* 18px */
    document.documentElement.style.setProperty('--text-xl', '1.25rem'); /* 20px */
    document.documentElement.style.setProperty('--text-2xl', '1.5rem'); /* 24px */
    document.documentElement.style.setProperty('--text-3xl', '1.875rem'); /* 30px */
    document.documentElement.style.setProperty('--text-4xl', '2.25rem'); /* 36px */
    document.documentElement.style.setProperty('--text-5xl', '3rem'); /* 48px */
    document.documentElement.style.setProperty('--text-6xl', '3.75rem'); /* 60px */
    document.documentElement.style.setProperty('--text-7xl', '4.5rem'); /* 72px */
    document.documentElement.style.setProperty('--text-8xl', '6rem'); /* 96px */
    document.documentElement.style.setProperty('--text-9xl', '8rem'); /* 128px */
    document.documentElement.style.setProperty('--spacing', '0.25rem'); /* 4px */
  }
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
