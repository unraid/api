<script setup lang="ts">
import { ref } from 'vue';
import Detail from '~/components/LayoutViews/Detail/Detail.vue';

import Console from '~/components/Docker/Console.vue';
import Edit from '~/components/Docker/Edit.vue';
import Logs from '~/components/Docker/Logs.vue';
import Overview from '~/components/Docker/Overview.vue';
import Preview from '~/components/Docker/Preview.vue';

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
];

const containerDetails = {
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

const tabs = [
  {
    key: 'overview',
    label: 'Overview',
    component: Overview,
    props: { details: containerDetails['immich'] },
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
    props: { port: containerDetails['immich']?.lanIpPort || '8080' },
  },
  {
    key: 'edit',
    label: 'Edit',
    component: Edit,
  },
];
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <h1 class="text-2xl font-bold mb-4">Docker Detail Component Test</h1>
    <Detail
      :items="dockerContainers"
      :tabs="tabs"
      default-item-id="immich"
    />
  </div>
</template>