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
  version?: string;
  network?: string;
  containerIp?: string | string[];
  containerPort?: string | string[];
  lanPort?: string | string[];
  volumes?: string;
  autoStart?: string;
  updates?: string;
  uptime?: string;
  containerId?: string;
  icon?: string;
}

export interface TreeDataOptions<T> {
  flatEntries?: MaybeRef<FlatOrganizerEntry[] | undefined>;
  flatData?: MaybeRef<T[]>;
  buildFlatRow?: (item: T, fallbackName?: string) => TreeRow<T>;
  unwrapRootFolder?: MaybeRef<boolean | string>;
}

export function useTreeData<T = unknown>(options: TreeDataOptions<T>) {
  const { flatEntries, flatData, buildFlatRow, unwrapRootFolder = true } = options;

  const treeData = computed<TreeRow<T>[]>(() => {
    const flat = unref(flatEntries);
    const fallbackFlat = unref(flatData);

    if (flat && flat.length > 0) {
      const entriesById = new Map(flat.map((e) => [e.id, e]));
      const rootEntries: TreeRow<T>[] = [];

      function buildTreeFromFlat(entry: FlatOrganizerEntry): TreeRow<T> {
        // When we have pre-flattened entries, reuse buildFlatRow so container-specific fields
        // like state/ports propagate to the tree row instead of staying inside meta.
        const builtFromMeta =
          entry.meta && buildFlatRow ? buildFlatRow(entry.meta as T, entry.name) : null;

        const row: TreeRow<T> = {
          id: entry.id,
          type: entry.type,
          name: entry.name,
          meta: (entry.meta as T) ?? builtFromMeta?.meta,
          children: [],
          icon: entry.icon || builtFromMeta?.icon || undefined,
        };

        if (builtFromMeta) {
          const {
            id: _id,
            type: _type,
            name: _name,
            children: _children,
            icon: _icon,
            meta: _meta,
            ...rest
          } = builtFromMeta;
          Object.assign(row, rest);
        }

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

      const unwrap = unref(unwrapRootFolder);
      if (unwrap) {
        const rootFolderId = typeof unwrap === 'string' ? unwrap : undefined;
        if (
          rootEntries.length === 1 &&
          rootEntries[0].type === 'folder' &&
          (!rootFolderId || rootEntries[0].id === rootFolderId)
        ) {
          return rootEntries[0].children || [];
        }
      }

      return rootEntries;
    }

    if (fallbackFlat && buildFlatRow) {
      return fallbackFlat.map((item) => buildFlatRow(item));
    }

    return [];
  });

  const entryParentById = computed<Record<string, string>>(() => {
    const entries = unref(flatEntries);
    if (!entries) return {};
    return Object.fromEntries(entries.filter((e) => e.parentId).map((e) => [e.id, e.parentId!]));
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
      entries.filter((e) => e.type === 'folder' && e.parentId).map((e) => [e.id, e.parentId!])
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
