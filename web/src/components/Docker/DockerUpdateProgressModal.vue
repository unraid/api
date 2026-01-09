<script setup lang="ts">
import { computed, resolveComponent } from 'vue';

import type { ContainerUpdateState } from '@/composables/useDockerUpdateProgress';

interface Props {
  open: boolean;
  containerStates: ContainerUpdateState[];
  activeContainerId: string | null;
  activeState: ContainerUpdateState | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:activeContainerId', value: string | null): void;
  (e: 'clear-completed'): void;
}>();

const UModal = resolveComponent('UModal');
const UButton = resolveComponent('UButton');
const UProgress = resolveComponent('UProgress');
const USelectMenu = resolveComponent('USelectMenu');
const UFormField = resolveComponent('UFormField');

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const currentContainerId = computed({
  get: () => props.activeContainerId,
  set: (val) => emit('update:activeContainerId', val),
});

const containerOptions = computed(() =>
  props.containerStates.map((state) => ({
    label: `${state.containerName} (${getStatusLabel(state.status)})`,
    value: state.containerId,
  }))
);

const hasCompletedUpdates = computed(() =>
  props.containerStates.some((s) => s.status === 'complete' || s.status === 'error')
);

const sortedLayers = computed(() => {
  if (!props.activeState) return [];
  return Array.from(props.activeState.layers.values()).sort((a, b) => {
    const statusOrder = ['Downloading', 'Extracting', 'Pull complete', 'Already exists'];
    const aIndex = statusOrder.findIndex((s) => a.status.toLowerCase().includes(s.toLowerCase()));
    const bIndex = statusOrder.findIndex((s) => b.status.toLowerCase().includes(s.toLowerCase()));
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.layerId.localeCompare(b.layerId);
  });
});

function getStatusLabel(status: ContainerUpdateState['status']): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'Updating';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    default:
      return status;
  }
}

function getStatusColor(status: ContainerUpdateState['status']): string {
  switch (status) {
    case 'pending':
      return 'text-muted-foreground';
    case 'in_progress':
      return 'text-blue-500';
    case 'complete':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    default:
      return '';
  }
}

function getLayerStatusIcon(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('downloading')) return 'i-lucide-download';
  if (statusLower.includes('extracting')) return 'i-lucide-package-open';
  if (statusLower.includes('complete') || statusLower.includes('done')) return 'i-lucide-check-circle';
  if (statusLower.includes('already exists')) return 'i-lucide-check';
  if (statusLower.includes('waiting')) return 'i-lucide-clock';
  return 'i-lucide-loader';
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Container Update Progress"
    :ui="{ footer: 'justify-between', overlay: 'z-50', content: 'z-50 max-w-2xl w-full' }"
  >
    <template #body>
      <div class="unapi space-y-4">
        <div v-if="containerStates.length === 0" class="text-muted-foreground text-sm">
          No active container updates.
        </div>
        <template v-else>
          <div v-if="containerStates.length > 1" class="flex items-end gap-4">
            <UFormField label="Container" class="min-w-[220px] flex-1">
              <USelectMenu
                v-model="currentContainerId"
                :items="containerOptions"
                label-key="label"
                value-key="value"
                placeholder="Select a container"
              />
            </UFormField>
          </div>

          <div v-if="activeState" class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ activeState.containerName }}</span>
                <span :class="getStatusColor(activeState.status)" class="text-sm">
                  {{ getStatusLabel(activeState.status) }}
                </span>
              </div>
              <span class="text-muted-foreground text-sm">
                {{ Math.round(activeState.overallProgress) }}%
              </span>
            </div>

            <UProgress :value="activeState.overallProgress" :max="100" size="md" />

            <div v-if="activeState.message" class="text-muted-foreground text-sm">
              {{ activeState.message }}
            </div>

            <div v-if="activeState.error" class="rounded bg-red-500/10 p-3 text-sm text-red-500">
              {{ activeState.error }}
            </div>

            <div v-if="sortedLayers.length > 0" class="border-border rounded border">
              <div class="bg-muted/50 border-border border-b px-3 py-2 text-sm font-medium">
                Layer Progress
              </div>
              <div class="max-h-64 overflow-y-auto">
                <div
                  v-for="layer in sortedLayers"
                  :key="layer.layerId"
                  class="border-border flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
                >
                  <span :class="getLayerStatusIcon(layer.status)" class="h-4 w-4 shrink-0" />
                  <span class="text-muted-foreground w-20 shrink-0 font-mono text-xs">
                    {{ layer.layerId.slice(0, 12) }}
                  </span>
                  <span class="flex-1 truncate text-sm">{{ layer.status }}</span>
                  <span
                    v-if="layer.progress !== undefined && layer.progress !== null"
                    class="text-muted-foreground text-xs"
                  >
                    {{ Math.round(layer.progress) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton
        v-if="hasCompletedUpdates"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="emit('clear-completed')"
      >
        Clear completed
      </UButton>
      <div v-else />
      <UButton color="neutral" variant="outline" @click="close">Close</UButton>
    </template>
  </UModal>
</template>
