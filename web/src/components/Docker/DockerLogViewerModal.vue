<script setup lang="ts">
import { computed, resolveComponent } from 'vue';

import SingleDockerLogViewer from '@/components/Docker/SingleDockerLogViewer.vue';

import type { LogSession } from '@/composables/useDockerLogSessions';

interface Props {
  open: boolean;
  sessions: LogSession[];
  activeSessionId: string | null;
  activeSession: LogSession | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:activeSessionId', value: string | null): void;
  (e: 'remove-session', id: string): void;
  (e: 'toggle-follow', value: boolean): void;
}>();

const UModal = resolveComponent('UModal');
const UFormField = resolveComponent('UFormField');
const USelectMenu = resolveComponent('USelectMenu');
const USwitch = resolveComponent('USwitch');
const UButton = resolveComponent('UButton');

const logSessionOptions = computed(() =>
  props.sessions.map((session) => ({
    label: session.label,
    value: session.id,
  }))
);

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const currentSessionId = computed({
  get: () => props.activeSessionId,
  set: (val) => emit('update:activeSessionId', val),
});
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Container logs"
    :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50 max-w-4xl w-full' }"
  >
    <template #body>
      <div class="unapi">
        <div v-if="sessions.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          Select a container to view its logs.
        </div>
        <div v-else class="space-y-4">
          <div class="flex flex-col gap-4 md:flex-row md:items-end">
            <UFormField label="Container" class="min-w-[220px] flex-1">
              <USelectMenu
                v-model="currentSessionId"
                :items="logSessionOptions"
                label-key="label"
                value-key="value"
                :disabled="logSessionOptions.length <= 1"
                placeholder="Select a container"
              />
            </UFormField>
            <div class="flex flex-1 flex-wrap items-end gap-3 md:justify-end">
              <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span>Follow logs</span>
                <USwitch
                  :model-value="activeSession?.autoFollow ?? true"
                  :disabled="!activeSession"
                  @update:model-value="(val: boolean) => emit('toggle-follow', val)"
                />
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-trash-2"
                  :disabled="!activeSession"
                  @click="() => activeSession && emit('remove-session', activeSession.id)"
                />
              </div>
            </div>
          </div>
          <div class="h-96 rounded border border-gray-200 dark:border-gray-700">
            <SingleDockerLogViewer
              v-if="activeSession"
              :container-name="activeSession.containerName"
              :auto-scroll="activeSession.autoFollow"
              class="h-full"
            />
          </div>
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton color="neutral" variant="outline" @click="close">Close</UButton>
    </template>
  </UModal>
</template>
