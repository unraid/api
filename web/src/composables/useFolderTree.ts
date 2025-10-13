import { computed, ref, unref } from 'vue';

import type { OrganizerEntry } from '@/composables/useTreeData';
import type { MaybeRef } from 'vue';

export interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
}

export interface FlatFolderRow {
  id: string;
  name: string;
  depth: number;
  hasChildren: boolean;
}

export interface FolderTreeOptions {
  organizerRoot?: MaybeRef<{ id: string; name?: string; children?: OrganizerEntry[] } | undefined>;
}

export function useFolderTree(options: FolderTreeOptions) {
  const { organizerRoot } = options;

  const expandedFolders = ref<Set<string>>(new Set());

  function buildFolderOnlyTree(
    entry?: { id: string; name?: string; children?: OrganizerEntry[] } | null
  ): FolderNode | null {
    if (!entry) return null;

    const folders: FolderNode[] = [];
    for (const child of entry.children || []) {
      if ((child as OrganizerEntry).__typename?.includes('Folder')) {
        const sub = buildFolderOnlyTree(
          child as { id: string; name?: string; children?: OrganizerEntry[] }
        );
        if (sub) folders.push(sub);
      }
    }

    return { id: entry.id, name: entry.name || 'Unnamed', children: folders };
  }

  const folderTree = computed<FolderNode | null>(() => {
    return buildFolderOnlyTree(unref(organizerRoot));
  });

  function flattenVisibleFolders(
    node: FolderNode | null,
    depth = 0,
    out: FlatFolderRow[] = []
  ): FlatFolderRow[] {
    if (!node) return out;

    out.push({
      id: node.id,
      name: node.name,
      depth,
      hasChildren: node.children.length > 0,
    });

    if (expandedFolders.value.has(node.id)) {
      for (const child of node.children) {
        flattenVisibleFolders(child, depth + 1, out);
      }
    }

    return out;
  }

  const visibleFolders = computed<FlatFolderRow[]>(() => {
    return flattenVisibleFolders(folderTree.value);
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
    folderTree,
    visibleFolders,
    expandedFolders,
    toggleExpandFolder,
    expandFolder,
    collapseFolder,
    setExpandedFolders,
  };
}
