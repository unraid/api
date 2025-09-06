<script setup lang="ts">
import { ref } from 'vue';

import Overview from '@/components/Docker/Overview.vue';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});

const testDetails = {
  network: 'Bridge',
  lanIpPort: '7878',
  containerIp: '172.17.0.4',
  uptime: '13 hours',
  containerPort: '9696:TCP',
  creationDate: '2 weeks ago',
  containerId: '472b4c2442b9',
  maintainer: 'ghcr.io/imagegenius/immich',
};
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <h1 class="mb-4 text-2xl font-bold">Test Overview Component</h1>
    <Overview :details="testDetails" />
  </div>
</template>
