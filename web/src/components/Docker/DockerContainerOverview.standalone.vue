<script setup lang="ts">
import DockerContainerOverview from '@/components/Docker/DockerContainerOverview.vue';
import DockerEdit from '@/components/Docker/Edit.vue';
import DockerLogs from '@/components/Docker/Logs.vue';
import DockerOverview from '@/components/Docker/Overview.vue';
import DockerPreview from '@/components/Docker/Preview.vue';

const item = { id: '1', label: 'Test', icon: 'test', badge: '1' };
const details = {
  network: 'bridge',
  lanIpPort: '192.168.1.100:8080',
  containerIp: '192.168.1.100',
  uptime: '2 hours',
  containerPort: '8080',
  creationDate: new Date().toISOString(),
  containerId: '1234567890',
  maintainer: 'John Doe',
};
</script>
<template>
  <div class="grid gap-8">
    <DockerContainerOverview />
    <DockerOverview :item="item" :details="details" />
    <DockerPreview :item="item" />
    <DockerEdit :item="item" />
    <DockerLogs :item="item" />
  </div>
</template>
