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
  <div class="border-warning/30 bg-warning/10 text-warning rounded-lg border p-4 text-sm">
    <div class="flex items-start gap-3">
      <UIcon name="i-lucide-triangle-alert" class="text-warning mt-1 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div class="w-full space-y-3">
        <div>
          <p class="text-sm font-semibold">Port conflicts detected ({{ totalPortConflictCount }})</p>
          <p class="text-warning/80 text-xs">
            Multiple containers are sharing the same LAN or container ports. Click a container below to
            open its editor or highlight it in the table.
          </p>
        </div>
        <div class="space-y-4">
          <div v-if="lanConflicts.length" class="space-y-2">
            <p class="text-warning/70 text-xs font-semibold tracking-wide uppercase">LAN ports</p>
            <div v-for="conflict in lanConflicts" :key="`lan-${conflict.lanIpPort}-${conflict.type}`"
              class="border-warning/30 bg-card/80 rounded-md border p-3">
              <div class="text-sm font-medium">{{ formatLanConflictLabel(conflict) }}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button v-for="container in conflict.containers" :key="container.id" type="button"
                  class="border-warning/50 bg-warning/20 text-warning hover:bg-warning/30 focus-visible:ring-warning/50 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none"
                  :title="`Edit ${container.name || 'container'}`" @click="handleConflictContainerAction(container)">
                  <span>{{ container.name || 'Container' }}</span>
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="containerConflicts.length" class="space-y-2">
            <p class="text-warning/70 text-xs font-semibold tracking-wide uppercase">Container ports</p>
            <div v-for="conflict in containerConflicts" :key="`container-${conflict.privatePort}-${conflict.type}`"
              class="border-warning/30 bg-card/80 rounded-md border p-3">
              <div class="text-sm font-medium">{{ formatContainerConflictLabel(conflict) }}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button v-for="container in conflict.containers" :key="container.id" type="button"
                  class="border-warning/50 bg-warning/20 text-warning hover:bg-warning/30 focus-visible:ring-warning/50 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none"
                  :title="`Edit ${container.name || 'container'}`" @click="handleConflictContainerAction(container)">
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
