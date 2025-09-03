<script setup lang="ts">
import SsoButtons from './sso/SsoButtons.vue';
</script>

<template>
  <SsoButtons />
</template>

<style>
/* Font size overrides for 16px base (standard Tailwind sizing) */
:root {
  /* Text sizes - standard Tailwind rem values */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */
  --text-6xl: 3.75rem; /* 60px */
  --text-7xl: 4.5rem; /* 72px */
  --text-8xl: 6rem; /* 96px */
  --text-9xl: 8rem; /* 128px */
  
  /* Spacing - standard Tailwind value */
  --spacing: 0.25rem; /* 4px */
}
</style>
