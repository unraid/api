<script setup lang="ts">
import { ref } from 'vue';
import Card from '~/components/LayoutViews/Card/Card.vue';

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
  {
    id: 'plex',
    label: 'Plex Media Server',
    icon: 'i-lucide-play',
    slot: 'plex' as const,
    status: [
      { label: 'Started', dotColor: 'bg-green-500' },
    ],
  },
  {
    id: 'radarr',
    label: 'Radarr',
    icon: 'i-lucide-film',
    slot: 'radarr' as const,
    status: [
      { label: 'Stopped', dotColor: 'bg-red-500' },
    ],
  },
];
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <h1 class="text-2xl font-bold mb-4">Docker Card Component Test</h1>
    <Card :items="dockerContainers" navigation-label="Docker Overview" />
  </div>
</template>