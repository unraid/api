import { computed, ref, unref } from 'vue';

import type { FlatOrganizerEntry } from '@/composables/gql/graphql';
import type { MaybeRef } from 'vue';

export interface FlatFolderRow {
  id: string;
  name: string;
  depth: number;
  hasChildren: boolean;
}

export interface FolderTreeOptions {
  flatEntries?: MaybeRef<FlatOrganizerEntry[] | undefined>;
}

export function useFolderTree(options: FolderTreeOptions) {
  const { flatEntries } = options;

  const expandedFolders = ref<Set<string>>(new Set());

  const allFolders = computed<FlatOrganizerEntry[]>(() => {
    const entries = unref(flatEntries);
    if (!entries) return [];
    return entries.filter((e) => e.type === 'folder');
  });

  const visibleFolders = computed<FlatFolderRow[]>(() => {
    const folders = allFolders.value;
    const visible: FlatFolderRow[] = [];
    const expanded = expandedFolders.value;

    const visibleIds = new Set<string>();

    for (const folder of folders) {
      if (!folder.parentId) {
        visibleIds.add(folder.id);
      } else if (visibleIds.has(folder.parentId) && expanded.has(folder.parentId)) {
        visibleIds.add(folder.id);
      }
    }

    for (const folder of folders) {
      if (visibleIds.has(folder.id)) {
        visible.push({
          id: folder.id,
          name: folder.name,
          depth: folder.depth,
          hasChildren: folder.hasChildren,
        });
      }
    }

    return visible;
  });

  function toggleExpandFolder(id: string) {
    const set = new Set(expandedFolders.value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    expandedFolders.value = set;
  }

  function expandFolder(id: string) {
    expandedFolders.value.add(id);
  }

  function collapseFolder(id: string) {
    expandedFolders.value.delete(id);
  }

  function setExpandedFolders(ids: string[]) {
    expandedFolders.value = new Set(ids);
  }

  return {
    visibleFolders,
    expandedFolders,
    toggleExpandFolder,
    expandFolder,
    collapseFolder,
    setExpandedFolders,
  };
}
