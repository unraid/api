<script setup lang="ts">
import { computed } from 'vue';

import type {
  ContainerPortConflict,
  LanPortConflict,
  PortConflictContainer,
} from '@/components/Docker/docker-port-conflicts.types';

interface Props {
  lanConflicts?: LanPortConflict[];
  containerConflicts?: ContainerPortConflict[];
}

const props = withDefaults(defineProps<Props>(), {
  lanConflicts: () => [],
  containerConflicts: () => [],
});

const emit = defineEmits<{ (e: 'container:select', payload: PortConflictContainer): void }>();

const totalPortConflictCount = computed(
  () => props.lanConflicts.length + props.containerConflicts.length
);

function handleConflictContainerAction(conflictContainer: PortConflictContainer) {
  emit('container:select', conflictContainer);
}

function formatLanConflictLabel(conflict: LanPortConflict): string {
  if (!conflict) return '';
  const lanValue = conflict.lanIpPort?.trim?.().length
    ? conflict.lanIpPort
    : conflict.publicPort?.toString() || 'LAN port';
  const protocol = conflict.type || 'TCP';
  return `${lanValue} (${protocol})`;
}

function formatContainerConflictLabel(conflict: ContainerPortConflict): string {
  if (!conflict) return '';
  const containerValue =
    typeof conflict.privatePort === 'number' ? conflict.privatePort : 'Container port';
  const protocol = conflict.type || 'TCP';
  return `${containerValue}/${protocol}`;
}
</script>

<template>
  <div
    class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/50 dark:bg-amber-400/10 dark:text-amber-100"
  >
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-triangle-alert"
        class="mt-1 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-300"
        aria-hidden="true"
      />
      <div class="w-full space-y-3">
        <div>
          <p class="text-sm font-semibold">Port conflicts detected ({{ totalPortConflictCount }})</p>
          <p class="text-xs text-amber-900/80 dark:text-amber-100/80">
            Multiple containers are sharing the same LAN or container ports. Click a container below to
            open its editor or highlight it in the table.
          </p>
        </div>
        <div class="space-y-4">
          <div v-if="lanConflicts.length" class="space-y-2">
            <p
              class="text-xs font-semibold tracking-wide text-amber-900/70 uppercase dark:text-amber-100/70"
            >
              LAN ports
            </p>
            <div
              v-for="conflict in lanConflicts"
              :key="`lan-${conflict.lanIpPort}-${conflict.type}`"
              class="rounded-md border border-amber-200/70 bg-white/80 p-3 dark:border-amber-300/30 dark:bg-transparent"
            >
              <div class="text-sm font-medium">{{ formatLanConflictLabel(conflict) }}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="container in conflict.containers"
                  :key="container.id"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none dark:border-amber-200/40 dark:bg-transparent dark:text-amber-100"
                  :title="`Edit ${container.name || 'container'}`"
                  @click="handleConflictContainerAction(container)"
                >
                  <span>{{ container.name || 'Container' }}</span>
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="containerConflicts.length" class="space-y-2">
            <p
              class="text-xs font-semibold tracking-wide text-amber-900/70 uppercase dark:text-amber-100/70"
            >
              Container ports
            </p>
            <div
              v-for="conflict in containerConflicts"
              :key="`container-${conflict.privatePort}-${conflict.type}`"
              class="rounded-md border border-amber-200/70 bg-white/80 p-3 dark:border-amber-300/30 dark:bg-transparent"
            >
              <div class="text-sm font-medium">{{ formatContainerConflictLabel(conflict) }}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="container in conflict.containers"
                  :key="container.id"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none dark:border-amber-200/40 dark:bg-transparent dark:text-amber-100"
                  :title="`Edit ${container.name || 'container'}`"
                  @click="handleConflictContainerAction(container)"
                >
                  <span>{{ container.name || 'Container' }}</span>
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
