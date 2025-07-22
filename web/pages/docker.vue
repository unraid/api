<script setup lang="ts">
import { definePageMeta } from '#imports';

import Console from '../components/Docker/Console.vue';
import Edit from '../components/Docker/Edit.vue';
import Logs from '../components/Docker/Logs.vue';
import Overview from '../components/Docker/Overview.vue';
import Preview from '../components/Docker/Preview.vue';
import Detail from '../components/LayoutViews/Detail.vue';

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
  },
  {
    id: 'organizrv2',
    label: 'organizrv2',
    icon: 'i-lucide-layers',
  },
  {
    id: 'jellyfin',
    label: 'Jellyfin',
    icon: 'i-lucide-film',
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    icon: 'i-lucide-database',
    badge: 'DB',
  },
  {
    id: 'postgres17',
    label: 'postgres17',
    icon: 'i-lucide-database',
    badge: 'DB',
  },
  {
    id: 'redis',
    label: 'Redis',
    icon: 'i-lucide-database',
    badge: 'DB',
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
    <Detail :navigation-items="dockerContainers" :tabs="tabs" default-navigation-id="immich" />
  </div>
</template>
