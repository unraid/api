<script setup lang="ts">
import { computed, ref } from 'vue';

import { Box, ChevronRight, Cog, FolderOpen, FolderTree } from 'lucide-vue-next';

import type { ResolvedOrganizerEntry, ResolvedOrganizerFolder } from '@/composables/gql/graphql';

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

const isSelected = (id: string) => props.selectedIds?.includes(id);

function onClickEntry(entry: ResolvedOrganizerEntry) {
  if (props.disabled) return;
  if (entry.__typename === 'OrganizerContainerResource') {
    emit('item:click', { id: entry.id, type: entry.type, name: entry.name });
  }
}

function isFolderEntry(entry: ResolvedOrganizerEntry): entry is ResolvedOrganizerFolder {
  return entry.__typename === 'ResolvedOrganizerFolder';
}

function entryName(entry: ResolvedOrganizerEntry): string {
  if (isFolderEntry(entry)) return entry.name;
  if (entry.__typename === 'OrganizerContainerResource') return entry.name;
  return '';
}

function onSelectEntry(entry: ResolvedOrganizerEntry, selected: boolean) {
  emit('item:select', { id: entry.id, type: entry.type, name: entryName(entry), selected });
}

function onCheckboxChange(entry: ResolvedOrganizerEntry, value: boolean | 'indeterminate') {
  onSelectEntry(entry, value === true);
}

const hasChildren = (entry: ResolvedOrganizerEntry) =>
  isFolderEntry(entry) && entry.children && entry.children.length > 0;

const entries = computed(() => props.root?.children ?? []);

const expandedIds = ref<Set<string>>(new Set());

const isExpanded = (id: string) => expandedIds.value.has(id);
function toggleExpanded(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
  expandedIds.value = new Set(expandedIds.value);
}

function expand(id: string) {
  if (!expandedIds.value.has(id)) {
    expandedIds.value.add(id);
    expandedIds.value = new Set(expandedIds.value);
  }
}

function flattenContainerEntries(entry: ResolvedOrganizerEntry): ResolvedOrganizerEntry[] {
  if (entry.__typename === 'OrganizerContainerResource') return [entry];
  if (isFolderEntry(entry)) {
    const children = entry.children ?? [];
    return children.flatMap((child) => flattenContainerEntries(child));
  }
  return [];
}

function folderSelectionState(folder: ResolvedOrganizerFolder): 'none' | 'partial' | 'all' {
  const containers = flattenContainerEntries(folder);
  if (containers.length === 0) return 'none';
  const selectedCount = containers.reduce((acc, e) => acc + (isSelected(e.id) ? 1 : 0), 0);
  if (selectedCount === 0) return 'none';
  if (selectedCount === containers.length) return 'all';
  return 'partial';
}

function onFolderCheckboxChange(folder: ResolvedOrganizerFolder, value: boolean | 'indeterminate') {
  const containers = flattenContainerEntries(folder);
  const shouldSelectAll =
    value === true || (value === 'indeterminate' && folderSelectionState(folder) !== 'all');
  if (shouldSelectAll) expand(folder.id);
  for (const entry of containers) {
    const currentlySelected = isSelected(entry.id);
    if (shouldSelectAll && !currentlySelected) onSelectEntry(entry, true);
    if (!shouldSelectAll && currentlySelected) onSelectEntry(entry, false);
  }
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="!root" class="text-gray-500 dark:text-gray-400">No items</div>
    <ul v-else class="space-y-1">
      <li v-for="entry in entries" :key="entry.id">
        <div class="flex items-center gap-2">
          <button
            v-if="isFolderEntry(entry)"
            class="inline-block h-4 w-4 transition-transform"
            :class="isExpanded(entry.id) ? 'rotate-90' : ''"
            :aria-expanded="isExpanded(entry.id) ? 'true' : 'false'"
            :disabled="disabled === true"
            @click="toggleExpanded(entry.id)"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
          <span v-else class="inline-block h-4 w-4" />

          <UCheckbox
            v-if="!isFolderEntry(entry)"
            :model-value="isSelected(entry.id)"
            :disabled="disabled === true"
            @click.stop
            @update:model-value="(v) => onCheckboxChange(entry, v)"
          />
          <UCheckbox
            v-else
            :indeterminate="folderSelectionState(entry) === 'partial'"
            :model-value="folderSelectionState(entry) === 'all'"
            :disabled="disabled === true"
            @click.stop
            @update:model-value="(v) => onFolderCheckboxChange(entry, v)"
          />

          <button
            class="flex-1 flex-row justify-around truncate"
            :class="[
              isFolderEntry(entry)
                ? 'cursor-pointer text-gray-700 dark:text-gray-200'
                : 'cursor-pointer',
              activeId === entry.id ? 'text-primary-600 dark:text-primary-400 font-medium' : '',
            ]"
            :disabled="disabled === true"
            @click="isFolderEntry(entry) ? toggleExpanded(entry.id) : onClickEntry(entry)"
          >
            <FolderTree
              v-if="isFolderEntry(entry)"
              class="mr-1 inline-block h-4 w-4 align-middle text-amber-600 dark:text-amber-400"
            />
            <Box
              v-else
              class="mr-1 inline-block h-4 w-4 align-middle text-blue-600 dark:text-blue-400"
            />
            {{ entryName(entry) }}
            <FolderOpen
              v-if="isFolderEntry(entry)"
              class="ml-2 inline-block h-4 w-4 align-middle text-amber-600/80 dark:text-amber-400/80"
            />
            <Cog
              v-else
              class="ml-2 inline-block h-4 w-4 align-middle text-blue-600/70 dark:text-blue-400/70"
            />
          </button>
        </div>

        <ul v-if="hasChildren(entry) && isExpanded(entry.id)" class="mt-1 ml-5 space-y-1">
          <li v-for="child in (entry as any).children" :key="child.id">
            <div class="flex items-center gap-2 text-sm md:text-[0.95rem]">
              <button
                v-if="isFolderEntry(child)"
                class="inline-block h-4 w-4 transition-transform"
                :class="isExpanded(child.id) ? 'rotate-90' : ''"
                :aria-expanded="isExpanded(child.id) ? 'true' : 'false'"
                :disabled="disabled === true"
                @click="toggleExpanded(child.id)"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
              <span v-else class="inline-block h-4 w-4" />

              <UCheckbox
                v-if="!isFolderEntry(child)"
                :model-value="isSelected(child.id)"
                :disabled="disabled === true"
                @click.stop
                @update:model-value="(v) => onCheckboxChange(child, v)"
              />
              <UCheckbox
                v-else
                :indeterminate="folderSelectionState(child) === 'partial'"
                :model-value="folderSelectionState(child) === 'all'"
                :disabled="disabled === true"
                @click.stop
                @update:model-value="(v) => onFolderCheckboxChange(child, v)"
              />
              <button
                class="flex-1 truncate text-left"
                :class="[
                  isFolderEntry(child)
                    ? 'cursor-pointer text-gray-700 dark:text-gray-200'
                    : 'cursor-pointer',
                  activeId === child.id ? 'text-primary-600 dark:text-primary-400 font-medium' : '',
                ]"
                :disabled="disabled === true"
                @click="isFolderEntry(child) ? toggleExpanded(child.id) : onClickEntry(child)"
              >
                <FolderTree
                  v-if="isFolderEntry(child)"
                  class="mr-1 inline-block h-4 w-4 align-middle text-amber-600 dark:text-amber-400"
                />
                <Box
                  v-else
                  class="mr-1 inline-block h-4 w-4 align-middle text-blue-600 dark:text-blue-400"
                />
                {{ entryName(child) }}
                <FolderOpen
                  v-if="isFolderEntry(child)"
                  class="ml-2 inline-block h-4 w-4 align-middle text-amber-600/80 dark:text-amber-400/80"
                />
                <Cog
                  v-else
                  class="ml-2 inline-block h-4 w-4 align-middle text-blue-600/70 dark:text-blue-400/70"
                />
              </button>
            </div>

            <ul v-if="hasChildren(child) && isExpanded(child.id)" class="mt-1 ml-5 space-y-1">
              <li v-for="grand in (child as any).children" :key="grand.id">
                <div class="flex items-center gap-2 text-sm md:text-[0.95rem]">
                  <span class="inline-block h-4 w-4" />
                  <UCheckbox
                    :model-value="isSelected(grand.id)"
                    :disabled="disabled === true"
                    @click.stop
                    @update:model-value="(v) => onCheckboxChange(grand, v)"
                  />
                  <button
                    class="flex-1 truncate text-left"
                    :class="[
                      activeId === grand.id ? 'text-primary-600 dark:text-primary-400 font-medium' : '',
                    ]"
                    :disabled="disabled === true"
                    @click="onClickEntry(grand)"
                  >
                    <Box
                      class="mr-1 inline-block h-4 w-4 align-middle text-blue-600 dark:text-blue-400"
                    />
                    {{ entryName(grand) }}
                    <Cog
                      class="ml-2 inline-block h-4 w-4 align-middle text-blue-600/70 dark:text-blue-400/70"
                    />
                  </button>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
