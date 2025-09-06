<script setup lang="ts">
interface Props {
  item: {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
  };
}

const props = defineProps<Props>();

const sampleLogs = [
  { timestamp: '2024-01-22 10:15:23', message: `Starting ${props.item.label}...` },
  { timestamp: '2024-01-22 10:15:24', message: 'Container initialized successfully' },
  { timestamp: '2024-01-22 10:15:25', message: 'Listening on configured port' },
  { timestamp: '2024-01-22 10:15:26', message: 'Health check passed' },
  { timestamp: '2024-01-22 10:15:27', message: 'Ready to accept connections' },
];
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between sm:mx-4">
      <h3 class="text-lg font-medium">Container Logs</h3>
      <UButton size="sm" color="primary" variant="outline" icon="i-lucide-download"> Export </UButton>
    </div>
    <div class="overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100 sm:mx-4">
      <div v-for="(log, index) in sampleLogs" :key="index" class="whitespace-nowrap">
        <span class="text-gray-500">[{{ log.timestamp }}]</span> {{ log.message }}
      </div>
    </div>
  </div>
</template>
