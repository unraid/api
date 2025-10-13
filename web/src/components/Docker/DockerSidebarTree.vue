<script setup lang="ts">
import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';

import type { DockerContainer, FlatOrganizerEntry } from '@/composables/gql/graphql';

interface Emits {
  (e: 'item:click', item: { id: string; type: string; name: string }): void;
  (e: 'item:select', item: { id: string; type: string; name: string; selected: boolean }): void;
}

interface Props {
  containers?: DockerContainer[];
  flatEntries?: FlatOrganizerEntry[];
  rootFolderId?: string;
  selectedIds?: string[];
  activeId?: string | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  containers: () => [],
  flatEntries: undefined,
  rootFolderId: 'root',
  selectedIds: () => [],
  activeId: null,
  disabled: false,
});

const emit = defineEmits<Emits>();

function onRowClick(payload: {
  id: string;
  type: 'container' | 'folder';
  name: string;
  containerId?: string;
}) {
  if (payload.type === 'container') {
    emit('item:click', { id: payload.id, type: payload.type, name: payload.name });
  }
}

function onRowSelect(payload: {
  id: string;
  type: 'container' | 'folder';
  name: string;
  containerId?: string;
  selected: boolean;
}) {
  if (payload.type === 'container') {
    emit('item:select', {
      id: payload.id,
      type: payload.type,
      name: payload.name,
      selected: payload.selected,
    });
  }
}
</script>

<template>
  <div class="space-y-2">
    <DockerContainersTable
      :containers="props.containers"
      :flat-entries="props.flatEntries"
      :root-folder-id="props.rootFolderId"
      compact
      :active-id="activeId"
      :selected-ids="selectedIds"
      :loading="props.disabled"
      @row:click="onRowClick"
      @row:select="onRowSelect"
    />
  </div>
</template>
