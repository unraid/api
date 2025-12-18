<script setup lang="ts">
import { computed, ref } from 'vue';

import type { FlatFolderRow } from '@/composables/useFolderTree';

interface Props {
  open: boolean;
  loading?: boolean;
  folders: FlatFolderRow[];
  expandedFolders: Set<string>;
  selectedFolderId: string;
  rootFolderId: string;
  renamingFolderId?: string;
  renameValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  renamingFolderId: '',
  renameValue: '',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:selectedFolderId', value: string): void;
  (e: 'update:renameValue', value: string): void;
  (e: 'toggle-expand', id: string): void;
  (e: 'create-folder', name: string): void;
  (e: 'delete-folder'): void;
  (e: 'start-rename', id: string, name: string): void;
  (e: 'commit-rename', id: string): void;
  (e: 'cancel-rename'): void;
  (e: 'confirm'): void;
}>();

const newFolderName = ref('');

const canCreateFolder = computed(() => newFolderName.value.trim().length > 0);
const canDeleteFolder = computed(
  () => props.selectedFolderId && props.selectedFolderId !== props.rootFolderId
);

function handleCreateFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;
  emit('create-folder', name);
  newFolderName.value = '';
}

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <UModal
    :open="open"
    title="Move to folder"
    :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UInput v-model="newFolderName" placeholder="New folder name" class="flex-1" />
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :disabled="!canCreateFolder"
            @click="handleCreateFolder"
          >
            Create
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :disabled="!canDeleteFolder"
            @click="$emit('delete-folder')"
          >
            Delete
          </UButton>
        </div>

        <div class="border-default rounded border">
          <div
            v-for="row in folders"
            :key="row.id"
            :data-id="row.id"
            class="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <UButton
              v-if="row.hasChildren"
              color="neutral"
              size="xs"
              variant="ghost"
              icon="i-lucide-chevron-right"
              :class="expandedFolders.has(row.id) ? 'rotate-90' : ''"
              square
              @click="$emit('toggle-expand', row.id)"
            />
            <span v-else class="inline-block w-5" />

            <input
              type="radio"
              :value="row.id"
              :checked="selectedFolderId === row.id"
              class="accent-primary"
              @change="$emit('update:selectedFolderId', row.id)"
            />

            <div
              :style="{ paddingLeft: `calc(${row.depth} * 0.75rem)` }"
              class="flex min-w-0 flex-1 items-center gap-2"
            >
              <span class="i-lucide-folder text-gray-500" />
              <template v-if="renamingFolderId === row.id">
                <input
                  :value="renameValue"
                  class="border-default bg-default flex-1 rounded border px-2 py-1"
                  @input="$emit('update:renameValue', ($event.target as HTMLInputElement).value)"
                  @keydown.enter.prevent="$emit('commit-rename', row.id)"
                  @keydown.esc.prevent="$emit('cancel-rename')"
                  @blur="$emit('commit-rename', row.id)"
                  autofocus
                />
              </template>
              <template v-else>
                <span class="truncate">{{ row.name }}</span>
              </template>
            </div>

            <UDropdownMenu
              :items="[
                [
                  {
                    label: 'Rename',
                    icon: 'i-lucide-pencil',
                    as: 'button',
                    onSelect: () => $emit('start-rename', row.id, row.name),
                  },
                ],
              ]"
              :ui="{ content: 'z-50' }"
            >
              <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" square />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="handleClose">Cancel</UButton>
      <UButton :loading="loading" :disabled="!selectedFolderId" @click="handleConfirm">
        Confirm
      </UButton>
    </template>
  </UModal>
</template>
