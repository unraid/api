<script setup lang="ts">
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

interface Props {
  item: {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
  };
  details?: ContainerDetails;
}

defineProps<Props>();
</script>

<template>
  <div v-if="details" class="space-y-4">
    <div class="grid grid-cols-1 gap-4 sm:mx-4 sm:grid-cols-2">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Network:</p>
        <p class="mt-1">{{ details.network }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">LAN IP:Port</p>
        <p class="mt-1">{{ details.lanIpPort }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Container IP:</p>
        <p class="mt-1">{{ details.containerIp }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime:</p>
        <p class="mt-1">{{ details.uptime }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Container Port:</p>
        <p class="mt-1">{{ details.containerPort }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Creation Date:</p>
        <p class="mt-1">{{ details.creationDate }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Container Id:</p>
        <p class="mt-1 font-mono text-sm">{{ details.containerId }}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintainer:</p>
        <p class="mt-1 text-sm">{{ details.maintainer }}</p>
      </div>
    </div>
  </div>
  <div v-else class="text-gray-500 sm:mx-4 dark:text-gray-400">
    No details available for {{ item.label }}
  </div>
</template>
