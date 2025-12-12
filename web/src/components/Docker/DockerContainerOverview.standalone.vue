<script setup lang="ts">
import DockerContainerManagement from '@/components/Docker/DockerContainerManagement.vue';
</script>
<template>
  <div class="grid gap-8">
    <DockerContainerManagement />
    <!-- <DockerContainerOverview /> -->
    <!-- <DockerOverview :item="item" :details="details" />
    <DockerPreview :item="item" />
    <DockerEdit :item="item" />
    <DockerLogs :item="item" /> -->
  </div>
</template>
