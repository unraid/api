<script setup lang="ts">
import { computed, h, ref, resolveComponent, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import BaseTreeTable from '@/components/Common/BaseTreeTable.vue';
import { UPDATE_DOCKER_AUTOSTART_CONFIGURATION } from '@/components/Docker/docker-update-autostart-configuration.mutation';
import { useTreeData } from '@/composables/useTreeData';
import { stripLeadingSlash } from '@/utils/docker';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { DropEvent } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component } from 'vue';

interface Props {
  containers: DockerContainer[];
  loading?: boolean;
  refresh?: () => Promise<unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  refresh: undefined,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

interface AutostartEntry {
  id: string;
  container: DockerContainer;
  autoStart: boolean;
  wait: number;
}

function sanitizeWait(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 0;
}

function sortContainers(containers: DockerContainer[]): DockerContainer[] {
  return [...containers].sort((a, b) => {
    const aEnabled = Boolean(a.autoStart);
    const bEnabled = Boolean(b.autoStart);
    if (aEnabled && bEnabled) {
      return (
        (a.autoStartOrder ?? Number.MAX_SAFE_INTEGER) - (b.autoStartOrder ?? Number.MAX_SAFE_INTEGER)
      );
    }
    if (aEnabled) return -1;
    if (bEnabled) return 1;
    const aName = stripLeadingSlash(a.names?.[0]);
    const bName = stripLeadingSlash(b.names?.[0]);
    return aName.localeCompare(bName);
  });
}

function containersToEntries(containers: DockerContainer[]): AutostartEntry[] {
  return sortContainers(containers).map((container) => ({
    id: container.id,
    container,
    autoStart: Boolean(container.autoStart),
    wait: sanitizeWait(container.autoStartWait),
  }));
}

const entries = ref<AutostartEntry[]>([]);
const selectedIds = ref<string[]>([]);

function hasOrderChanged(previous?: AutostartEntry[]) {
  if (!previous) return false;
  if (previous.length !== entries.value.length) return true;
  return previous.some((entry, index) => entry.id !== entries.value[index]?.id);
}

watch(
  () => props.containers,
  (containers) => {
    const normalized = containersToEntries(containers);
    const current = entries.value;
    const isDifferent =
      normalized.length !== current.length ||
      normalized.some((entry, index) => {
        const existing = current[index];
        if (!existing) return true;
        return (
          entry.id !== existing.id ||
          entry.autoStart !== existing.autoStart ||
          entry.wait !== existing.wait
        );
      });
    if (isDifferent) {
      entries.value = normalized;
    }
  },
  { immediate: true, deep: true }
);

const { treeData } = useTreeData<AutostartEntry>({
  flatData: entries,
  buildFlatRow(entry) {
    const name = stripLeadingSlash(entry.container.names?.[0]) || 'Unknown';
    return {
      id: entry.id,
      type: 'container',
      name,
      state: entry.container.state ?? '',
      meta: entry,
    };
  },
});

function getRowIndex(id: string) {
  return entries.value.findIndex((entry) => entry.id === id);
}

function canMoveUp(id: string): boolean {
  return getRowIndex(id) > 0;
}

function canMoveDown(id: string): boolean {
  const index = getRowIndex(id);
  return index >= 0 && index < entries.value.length - 1;
}

async function handleMoveUp(id: string) {
  if (mutationLoading.value) return;
  const index = getRowIndex(id);
  if (index <= 0) return;

  const snapshot = entries.value.map((entry) => ({ ...entry }));
  const [removed] = entries.value.splice(index, 1);
  entries.value.splice(index - 1, 0, removed);
  await persistConfiguration(snapshot);
}

async function handleMoveDown(id: string) {
  if (mutationLoading.value) return;
  const index = getRowIndex(id);
  if (index < 0 || index >= entries.value.length - 1) return;

  const snapshot = entries.value.map((entry) => ({ ...entry }));
  const [removed] = entries.value.splice(index, 1);
  entries.value.splice(index + 1, 0, removed);
  await persistConfiguration(snapshot);
}

const { mutate, loading: mutationLoading } = useMutation(UPDATE_DOCKER_AUTOSTART_CONFIGURATION);

const errorMessage = ref<string | null>(null);

async function persistConfiguration(previousSnapshot?: AutostartEntry[]) {
  try {
    errorMessage.value = null;
    const persistUserPreferences = hasOrderChanged(previousSnapshot);
    await mutate({
      entries: entries.value.map((entry) => ({
        id: entry.id,
        autoStart: entry.autoStart,
        wait: entry.autoStart ? entry.wait : 0,
      })),
      persistUserPreferences,
    });
    if (props.refresh) {
      await props.refresh().catch((refreshError: unknown) => {
        if (refreshError instanceof Error) {
          errorMessage.value = refreshError.message;
        } else {
          errorMessage.value = 'Auto-start updated but failed to refresh data.';
        }
      });
    }
  } catch (error) {
    if (previousSnapshot) {
      entries.value = previousSnapshot.map((entry) => ({ ...entry }));
    }
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'Failed to update auto-start configuration.';
    }
  }
}

async function handleToggle(entry: AutostartEntry, value: boolean) {
  if (mutationLoading.value || entry.autoStart === value) return;
  const snapshot = entries.value.map((item) => ({ ...item }));
  entry.autoStart = value;
  if (!value) {
    entry.wait = 0;
  }
  await persistConfiguration(snapshot);
}

async function handleWaitChange(entry: AutostartEntry, value: string | number) {
  if (mutationLoading.value) return;
  const normalized = sanitizeWait(value);
  if (normalized === entry.wait) return;
  const snapshot = entries.value.map((item) => ({ ...item }));
  entry.wait = normalized;
  await persistConfiguration(snapshot);
}

async function handleBulkToggle() {
  if (saving.value || !selectedIds.value.length) return;
  const snapshot = entries.value.map((item) => ({ ...item }));
  const selected = new Set(selectedIds.value);
  entries.value.forEach((entry) => {
    if (!selected.has(entry.id)) return;
    entry.autoStart = !entry.autoStart;
    if (!entry.autoStart) {
      entry.wait = 0;
    }
  });
  await persistConfiguration(snapshot);
}

async function handleDrop(event: DropEvent<AutostartEntry>) {
  if (mutationLoading.value) return;
  const { target, area, sourceIds } = event;
  const targetIndex = getRowIndex(target.id);
  if (targetIndex === -1) return;

  const snapshot = entries.value.map((entry) => ({ ...entry }));
  const movingEntries = entries.value.filter((entry) => sourceIds.includes(entry.id));
  let remainingEntries = entries.value.filter((entry) => !sourceIds.includes(entry.id));

  let insertionIndex = targetIndex;
  if (area === 'after' || area === 'inside') {
    insertionIndex += 1;
  }

  remainingEntries.splice(insertionIndex, 0, ...movingEntries);
  entries.value = remainingEntries;

  await persistConfiguration(snapshot);
}

function handleClose() {
  if (mutationLoading.value) return;
  emit('close');
}

const busyRowIds = computed(() => {
  if (!mutationLoading.value) return new Set<string>();
  return new Set(entries.value.map((entry) => entry.id));
});

const saving = computed(() => props.loading || mutationLoading.value);
const hasSelection = computed(() => selectedIds.value.length > 0);

const UBadge = resolveComponent('UBadge') as Component;
const USwitch = resolveComponent('USwitch') as Component;
const UInput = resolveComponent('UInput') as Component;
const UButton = resolveComponent('UButton') as Component;

const columns = computed<TableColumn<TreeRow<AutostartEntry>>[]>(() => {
  const cols: TableColumn<TreeRow<AutostartEntry>>[] = [
    {
      id: 'order',
      header: '#',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-xs font-medium text-gray-500 dark:text-gray-400' },
          String(getRowIndex(row.original.id) + 1)
        ),
      meta: { class: { td: 'w-10', th: 'w-10' } },
    },
    {
      id: 'name',
      header: 'Container',
      cell: ({ row }) => {
        const entry = row.original.meta;
        if (!entry) return row.original.name;
        const badge = entry.container.state
          ? h(UBadge, {
              label: entry.container.state,
              variant: 'subtle',
              size: 'sm',
            })
          : null;
        return h('div', { class: 'flex items-center justify-between gap-3 pr-2' }, [
          h('span', { class: 'font-medium' }, row.original.name),
          badge,
        ]);
      },
    },
    {
      id: 'autoStart',
      header: 'Auto Start',
      cell: ({ row }) => {
        const entry = row.original.meta;
        if (!entry) return '';
        return h(USwitch, {
          modelValue: entry.autoStart,
          'onUpdate:modelValue': (value: boolean) => handleToggle(entry, value),
          disabled: saving.value,
        });
      },
      meta: { class: { td: 'w-32', th: 'w-32' } },
    },
    {
      id: 'wait',
      header: 'Start Delay (s)',
      cell: ({ row }) => {
        const entry = row.original.meta;
        if (!entry) return '';
        return h(UInput, {
          type: 'number',
          min: 0,
          disabled: saving.value || !entry.autoStart,
          modelValue: entry.wait,
          class: 'w-24',
          'onUpdate:modelValue': (value: string | number) => handleWaitChange(entry, value),
        });
      },
      meta: { class: { td: 'w-48', th: 'w-48' } },
    },
    {
      id: 'actions',
      header: 'Order',
      cell: ({ row }) => {
        const id = row.original.id;
        return h('div', { class: 'flex items-center gap-1' }, [
          h(UButton, {
            size: 'xs',
            variant: 'ghost',
            icon: 'i-lucide-arrow-up',
            'aria-label': 'Move up',
            disabled: saving.value || !canMoveUp(id),
            onClick: () => handleMoveUp(id),
          }),
          h(UButton, {
            size: 'xs',
            variant: 'ghost',
            icon: 'i-lucide-arrow-down',
            'aria-label': 'Move down',
            disabled: saving.value || !canMoveDown(id),
            onClick: () => handleMoveDown(id),
          }),
        ]);
      },
      meta: { class: { td: 'w-24', th: 'w-24' } },
    },
  ];
  return cols;
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Docker Auto-Start Order</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Drag containers or use the arrow buttons to adjust the auto-start sequence. Changes are saved
          automatically.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          variant="soft"
          icon="i-lucide-toggle-right"
          :disabled="!hasSelection || saving"
          @click="handleBulkToggle"
        >
          Toggle Auto Start
        </UButton>
        <UButton
          size="sm"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :disabled="saving"
          @click="handleClose"
        >
          Back to Overview
        </UButton>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <BaseTreeTable
      :data="treeData"
      :columns="columns"
      :loading="saving"
      :enable-drag-drop="true"
      :busy-row-ids="busyRowIds"
      :can-expand="() => false"
      :can-select="(row: any) => row.type === 'container'"
      :can-drag="() => true"
      :can-drop-inside="() => false"
      v-model:selected-ids="selectedIds"
      @row:drop="handleDrop"
    />
  </div>
</template>
