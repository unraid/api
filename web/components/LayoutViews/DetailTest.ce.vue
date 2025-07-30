<script setup lang="ts">
import Console from '../Docker/Console.vue';
import Edit from '../Docker/Edit.vue';
import Logs from '../Docker/Logs.vue';
import Overview from '../Docker/Overview.vue';
import Preview from '../Docker/Preview.vue';
import Detail from '../LayoutViews/Detail/Detail.vue';

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
</script>

<template>
  <div class="h-full">
    <Detail :items="dockerContainers" :tabs="tabs" default-item-id="immich" />
  </div>
</template>
