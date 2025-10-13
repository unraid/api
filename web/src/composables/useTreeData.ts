import { computed, unref } from 'vue';

import type { FlatOrganizerEntry } from '@/composables/gql/graphql';
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

export interface TreeDataOptions<T> {
  flatEntries?: MaybeRef<FlatOrganizerEntry[] | undefined>;
  flatData?: MaybeRef<T[]>;
  buildFlatRow?: (item: T) => TreeRow<T>;
}

export function useTreeData<T = unknown>(options: TreeDataOptions<T>) {
  const { flatEntries, flatData, buildFlatRow } = options;

  const treeData = computed<TreeRow<T>[]>(() => {
    const flat = unref(flatEntries);
    const fallbackFlat = unref(flatData);

    if (flat && flat.length > 0) {
      const entriesById = new Map(flat.map((e) => [e.id, e]));
      const rootEntries: TreeRow<T>[] = [];

      function buildTreeFromFlat(entry: FlatOrganizerEntry): TreeRow<T> {
        const row: TreeRow<T> = {
          id: entry.id,
          type: entry.type,
          name: entry.name,
          meta: entry.meta as T,
          children: [],
        };

        if (entry.hasChildren) {
          row.children = entry.childrenIds
            .map((childId) => entriesById.get(childId))
            .filter(Boolean)
            .map((child) => buildTreeFromFlat(child!));
        }

        return row;
      }

      for (const entry of flat) {
        if (!entry.parentId) {
          rootEntries.push(buildTreeFromFlat(entry));
        }
      }

      return rootEntries;
    }

    if (fallbackFlat && buildFlatRow) {
      return fallbackFlat.map(buildFlatRow);
    }

    return [];
  });

  const entryParentById = computed<Record<string, string>>(() => {
    const entries = unref(flatEntries);
    if (!entries) return {};
    return Object.fromEntries(
      entries.filter((e) => e.parentId).map((e) => [e.id, e.parentId!])
    );
  });

  const folderChildrenIds = computed<Record<string, string[]>>(() => {
    const entries = unref(flatEntries);
    if (!entries) return {};
    return Object.fromEntries(
      entries.filter((e) => e.type === 'folder').map((e) => [e.id, e.childrenIds])
    );
  });

  const parentById = computed<Record<string, string>>(() => {
    const entries = unref(flatEntries);
    if (!entries) return {};
    return Object.fromEntries(
      entries
        .filter((e) => e.type === 'folder' && e.parentId)
        .map((e) => [e.id, e.parentId!])
    );
  });

  const positionById = computed<Record<string, number>>(() => {
    const entries = unref(flatEntries);
    if (!entries) return {};
    return Object.fromEntries(entries.map((e) => [e.id, e.position]));
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
    positionById,
    flattenRows,
    getRowById,
  };
}
