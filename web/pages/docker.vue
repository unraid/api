<script setup lang="ts">
import { ref } from 'vue';

import { definePageMeta } from '#imports';

import Console from '../components/Docker/Console.vue';
import Edit from '../components/Docker/Edit.vue';
import Logs from '../components/Docker/Logs.vue';
import Overview from '../components/Docker/Overview.vue';
import Preview from '../components/Docker/Preview.vue';
import Card from '../components/LayoutViews/Card/Card.vue';
import Detail from '../components/LayoutViews/Detail/Detail.vue';

definePageMeta({
  layout: 'unraid-next',
});

interface ContainerDetails {
  network: string;
  lanIpPort: string;
  containerIp: string;
  uptime: string;
  containerPort: string;
  creationDate: string;
  containerId: string;
  maintainer: string;
}

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
    id: 'jellyfin',
    label: 'Jellyfin',
    icon: 'i-lucide-film',
    slot: 'jellyfin' as const,
    status: [{ label: 'Stopped', dotColor: 'bg-red-500' }],
  },
  {
    id: 'databases',
    label: 'Databases',
    icon: 'i-lucide-database',
    slot: 'databases' as const,
    isGroup: true,
    children: [
      {
        id: 'mongodb',
        label: 'MongoDB',
        icon: 'i-lucide-leafy-green',
        badge: 'DB',
        slot: 'mongodb' as const,
        status: [{ label: 'Started', dotColor: 'bg-green-500' }],
      },
      {
        id: 'postgres17',
        label: 'postgres17',
        icon: 'i-lucide-pyramid',
        badge: 'DB',
        slot: 'postgres17' as const,
        status: [
          { label: 'Update available', dotColor: 'bg-orange-500' },
          { label: 'Paused', dotColor: 'bg-blue-500' },
        ],
      },
      {
        id: 'redis',
        label: 'Redis',
        icon: 'i-lucide-panda',
        badge: 'DB',
        slot: 'redis' as const,
        status: [{ label: 'Started', dotColor: 'bg-green-500' }],
      },
    ],
  },
];

const containerDetails: Record<string, ContainerDetails> = {
  immich: {
    network: 'Bridge',
    lanIpPort: '7878',
    containerIp: '172.17.0.4',
    uptime: '13 hours',
    containerPort: '9696:TCP',
    creationDate: '2 weeks ago',
    containerId: '472b4c2442b9',
    maintainer: 'ghcr.io/imagegenius/immich',
  },
};

const getTabsWithProps = (containerId: string) => [
  {
    key: 'overview',
    label: 'Overview',
    component: Overview,
    props: { details: containerDetails[containerId] },
  },
  {
    key: 'logs',
    label: 'Logs',
    component: Logs,
  },
  {
    key: 'console',
    label: 'Console',
    component: Console,
  },
  {
    key: 'preview',
    label: 'Preview',
    component: Preview,
    props: { port: containerDetails[containerId]?.lanIpPort || '8080' },
  },
  {
    key: 'edit',
    label: 'Edit',
    component: Edit,
  },
];

const tabs = getTabsWithProps('immich');

// View mode toggle
const viewMode = ref<'detail' | 'card'>('detail');

const toggleView = () => {
  viewMode.value = viewMode.value === 'detail' ? 'card' : 'detail';
};
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- View Toggle Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Docker</h1>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <UButton
            :icon="viewMode === 'detail' ? 'i-lucide-list' : 'i-lucide-grid-3x3'"
            :color="viewMode === 'detail' ? 'primary' : 'neutral'"
            :variant="viewMode === 'detail' ? 'solid' : 'outline'"
            size="sm"
            @click="toggleView"
          >
            {{ viewMode === 'detail' ? 'Detail' : 'Card' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- View Content -->
    <div class="flex-1 min-h-0">
      <Detail
        v-if="viewMode === 'detail'"
        :items="dockerContainers"
        :tabs="tabs"
        default-item-id="immich"
      />
      <Card v-else :items="dockerContainers" navigation-label="Docker Overview" />
    </div>
  </div>
</template>
