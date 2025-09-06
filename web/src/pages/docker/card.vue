<script setup lang="ts">
import { ref } from 'vue';

import Card from '@/components/LayoutViews/Card/Card.vue';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});

const dockerContainers = [
  {
    id: 'immich',
    label: 'immich',
    icon: 'i-lucide-play-circle',
    slot: 'immich' as const,
    status: [
      { label: 'Update available', dotColor: 'bg-orange-500' },
      { label: 'Started', dotColor: 'bg-green-500' },
    ],
  },
  {
    id: 'organizrv2',
    label: 'organizrv2',
    icon: 'i-lucide-layers',
    slot: 'organizrv2' as const,
    status: [{ label: 'Started', dotColor: 'bg-green-500' }],
  },
];
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <h1 class="mb-4 text-2xl font-bold">Test Card Component</h1>
    <Card :items="dockerContainers" navigation-label="Docker Overview" />
  </div>
</template>
