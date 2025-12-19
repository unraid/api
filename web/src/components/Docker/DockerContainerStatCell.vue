<script setup lang="ts">
import { computed } from 'vue';

import type { DockerContainerStats } from '@/composables/gql/graphql';

interface Props {
  containerId?: string | null;
  statsMap: Map<string, DockerContainerStats>;
  type: 'cpu' | 'memory';
}

const props = defineProps<Props>();

const value = computed(() => {
  if (!props.containerId) return '—';
  const stats = props.statsMap.get(props.containerId);
  if (!stats) return '—';

  if (props.type === 'cpu') {
    return `${stats.cpuPercent.toFixed(2)}%`;
  }
  return stats.memUsage;
});
</script>

<template>
  <span class="tabular-nums">{{ value }}</span>
</template>
