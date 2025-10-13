import { computed, unref } from 'vue';

import type { MaybeRef } from 'vue';

export interface TreeRow<T = unknown> {
  id: string;
  type: string;
  name: string;
  children?: TreeRow<T>[];
  meta?: T;
  state?: string;
  ports?: string;
  autoStart?: string;
  updates?: string;
  containerId?: string;
}

export interface OrganizerEntry {
  __typename?: string;
  id: string;
  name?: string;
  children?: OrganizerEntry[];
  meta?: unknown;
  type?: string;
}

export interface TreeDataOptions<T> {
  organizerRoot?: MaybeRef<{ id: string; children?: OrganizerEntry[] } | undefined>;
  flatData?: MaybeRef<T[]>;
  buildTreeRow: (entry: OrganizerEntry) => TreeRow<T> | null;
  buildFlatRow?: (item: T) => TreeRow<T>;
}

export function useTreeData<T = unknown>(options: TreeDataOptions<T>) {
  const { organizerRoot, flatData, buildTreeRow, buildFlatRow } = options;

  function buildTree(entry: OrganizerEntry): TreeRow<T> | null {
    if (entry.__typename?.includes('Folder')) {
      const children = (entry.children || [])
        .map((child) => buildTree(child))
        .filter(Boolean) as TreeRow<T>[];

      return {
        id: entry.id,
        type: 'folder',
        name: entry.name || 'Unnamed',
        children,
      };
    }

    return buildTreeRow(entry);
  }

  const treeData = computed<TreeRow<T>[]>(() => {
    const root = unref(organizerRoot);
    const flat = unref(flatData);

    if (root) {
      return (root.children || []).map((child) => buildTree(child)).filter(Boolean) as TreeRow<T>[];
    }

    if (flat && buildFlatRow) {
      return flat.map(buildFlatRow);
    }

    return [];
  });

  const entryParentById = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    const root = unref(organizerRoot);

    function walk(node?: { id: string; children?: OrganizerEntry[] } | null) {
      if (!node) return;
      for (const child of node.children || []) {
        const id = (child as { id?: string }).id;
        if (id) map[id] = node.id;
        if ((child as OrganizerEntry).__typename?.includes('Folder')) {
          walk(child as { id: string; children?: OrganizerEntry[] });
        }
      }
    }

    walk(root);
    return map;
  });

  const folderChildrenIds = computed<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    const root = unref(organizerRoot);

    function walk(node?: { id: string; children?: OrganizerEntry[] } | null) {
      if (!node) return;
      map[node.id] = (node.children || []).map((c) => (c as { id: string }).id);

      for (const child of node.children || []) {
        if ((child as OrganizerEntry).__typename?.includes('Folder')) {
          walk(child as { id: string; children?: OrganizerEntry[] });
        }
      }
    }

    walk(root);
    return map;
  });

  const parentById = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    const root = unref(organizerRoot);

    function walk(node?: { id: string; children?: OrganizerEntry[] } | null, parentId?: string) {
      if (!node) return;
      if (parentId) map[node.id] = parentId;

      for (const child of node.children || []) {
        if ((child as OrganizerEntry).__typename?.includes('Folder')) {
          walk(child as { id: string; children?: OrganizerEntry[] }, node.id);
        }
      }
    }

    walk(root, undefined);
    return map;
  });

  function flattenRows(rows: TreeRow<T>[], filterType?: string): TreeRow<T>[] {
    const out: TreeRow<T>[] = [];
    for (const r of rows) {
      if (!filterType || r.type === filterType) out.push(r);
      if (r.children?.length) {
        out.push(...flattenRows(r.children, filterType));
      }
    }
    return out;
  }

  function getRowById(targetId: string, rows: TreeRow<T>[]): TreeRow<T> | undefined {
    for (const r of rows) {
      if (r.id === targetId) return r;
      if (r.children?.length) {
        const found = getRowById(targetId, r.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  return {
    treeData,
    entryParentById,
    folderChildrenIds,
    parentById,
    flattenRows,
    getRowById,
  };
}
