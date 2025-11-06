<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINER_SIZES } from '@/components/Docker/docker-container-sizes.query';

import type { GetDockerContainerSizesQuery } from '@/composables/gql/graphql';

export interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const { result, loading, refetch } = useQuery<GetDockerContainerSizesQuery>(
  GET_DOCKER_CONTAINER_SIZES,
  undefined,
  {
    fetchPolicy: 'network-only',
    enabled: computed(() => isOpen.value),
  }
);

const containers = computed(() => result.value?.docker?.containers ?? []);

const tableRows = computed(() => {
  return containers.value
    .map((container) => {
      const primaryName = container.names?.[0]?.replace(/^\//, '') || 'Unknown';
      const totalBytes = container.sizeRootFs ?? 0;
      const writableBytes = container.sizeRw ?? 0;
      const logBytes = container.sizeLog ?? 0;

      return {
        id: container.id,
        name: primaryName,
        totalBytes,
        writableBytes,
        logBytes,
      };
    })
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      total: formatBytes(entry.totalBytes),
      writable: formatBytes(entry.writableBytes),
      log: formatBytes(entry.logBytes),
    }));
});

const totals = computed(() => {
  const aggregate = containers.value.reduce(
    (acc, container) => {
      acc.total += container.sizeRootFs ?? 0;
      acc.writable += container.sizeRw ?? 0;
      acc.log += container.sizeLog ?? 0;
      return acc;
    },
    { total: 0, writable: 0, log: 0 }
  );

  return {
    total: formatBytes(aggregate.total),
    writable: formatBytes(aggregate.writable),
    log: formatBytes(aggregate.log),
  };
});

const columns = computed(() => [
  {
    accessorKey: 'name',
    header: 'Container',
    footer: 'Totals',
  },
  {
    accessorKey: 'total',
    header: 'Total',
    footer: totals.value.total,
    meta: { class: { td: 'text-right font-mono text-sm', th: 'text-right' } },
  },
  {
    accessorKey: 'writable',
    header: 'Writable',
    footer: totals.value.writable,
    meta: { class: { td: 'text-right font-mono text-sm', th: 'text-right' } },
  },
  {
    accessorKey: 'log',
    header: 'Log',
    footer: totals.value.log,
    meta: { class: { td: 'text-right font-mono text-sm', th: 'text-right' } },
  },
]);

// Format byte counts into a short human-readable string (e.g. "1.2 GB").
function formatBytes(value?: number | null): string {
  if (!Number.isFinite(value ?? NaN) || value === null || value === undefined) {
    return '—';
  }
  if (value === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: size < 10 ? 2 : 1,
    minimumFractionDigits: size < 10 && unitIndex > 0 ? 1 : 0,
  });

  return `${formatter.format(size)} ${units[unitIndex]}`;
}

async function handleRefresh() {
  await refetch();
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Container Sizes"
    :ui="{ footer: 'justify-end', content: 'sm:max-w-4xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Includes total filesystem, writable layer, and log file sizes per container.
          </p>
          <UButton
            size="sm"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="loading"
            @click="handleRefresh"
          >
            Refresh
          </UButton>
        </div>

        <UTable
          :data="tableRows"
          :columns="columns"
          :loading="loading"
          sticky="header"
          :ui="{ td: 'py-2 px-3', th: 'py-2 px-3 text-left', tfoot: 'bg-gray-50 dark:bg-gray-900' }"
        >
          <template #empty>
            <div class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No containers found.
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UModal>
</template>
