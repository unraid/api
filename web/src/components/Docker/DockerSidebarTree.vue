<script setup lang="ts">
import { computed } from 'vue';

import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';

import type { ResolvedOrganizerFolder } from '@/composables/gql/graphql';

interface Emits {
  (e: 'item:click', item: { id: string; type: string; name: string }): void;
  (e: 'item:select', item: { id: string; type: string; name: string; selected: boolean }): void;
}

interface Props {
  root?: ResolvedOrganizerFolder;
  selectedIds?: string[];
  activeId?: string | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  activeId: null,
  disabled: false,
});

const emit = defineEmits<Emits>();

const containers = computed(() => []);

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
      :containers="containers"
      :organizer-root="root"
      compact
      :active-id="activeId"
      :selected-ids="selectedIds"
      :loading="props.disabled"
      @row:click="onRowClick"
      @row:select="onRowSelect"
    />
  </div>
</template>
