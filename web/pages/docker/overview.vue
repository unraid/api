<script setup lang="ts">
import { ref } from 'vue';
import { definePageMeta } from '#imports';
import Overview from '../../components/Docker/Overview.vue';

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
  <div class="h-full flex flex-col p-4">
    <h1 class="text-2xl font-bold mb-4">Test Overview Component</h1>
    <Overview :details="testDetails" />
  </div>
</template>
