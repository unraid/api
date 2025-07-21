<script setup lang="ts">
import { ref } from 'vue';

import { UNavigationMenu, UPage } from '#components';

const items = ref([
  {
    label: 'Guide',
    icon: 'i-lucide-book-open',
    to: '/getting-started',
    children: [
      {
        label: 'Introduction',
        description: 'Fully styled and customizable components for Nuxt.',
        icon: 'i-lucide-house',
      },
      {
        label: 'Installation',
        description: 'Learn how to install and configure Nuxt UI in your application.',
        icon: 'i-lucide-cloud-download',
      },
    ],
  },
  {
    label: 'Components',
    icon: 'i-lucide-box',
    to: '/components',
    active: true,
    children: [
      {
        label: 'Link',
        icon: 'i-lucide-file-text',
        description: 'Use NuxtLink with superpowers.',
        to: '/components/link',
      },
      {
        label: 'Modal',
        icon: 'i-lucide-file-text',
        description: 'Display a modal within your application.',
        to: '/components/modal',
      },
    ],
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    badge: '3.8k',
    to: 'https://github.com/nuxt/ui',
    target: '_blank',
  },
  {
    label: 'Help',
    icon: 'i-lucide-circle-help',
    disabled: true,
  },
]);
</script>

<template>
  <UPage>
    <template #left>
      <UNavigationMenu collapsed orientation="vertical" :items="items" />
    </template>

    <slot />
  </UPage>
</template>
