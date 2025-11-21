import { ref, unref, watch } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { MaybeRef, Ref } from 'vue';

export interface RowSelectionOptions<T = unknown> {
  selectedIds?: Ref<string[]>;
  treeData: MaybeRef<TreeRow<T>[]>;
  selectableType?: string;
  isSelectable?: (row: TreeRow<T>) => boolean;
}

export function useRowSelection<T = unknown>(options: RowSelectionOptions<T>) {
  const { selectedIds, treeData, selectableType, isSelectable } = options;

  const rowSelection = ref<Record<string, boolean>>({});

  function canSelectRow(row: TreeRow<T>): boolean {
    if (isSelectable) {
      return isSelectable(row);
    }
    if (selectableType) {
      return row.type === selectableType;
    }
    return true;
  }

  function arraysEqualAsSets(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    for (const id of b) if (!setA.has(id)) return false;
    return true;
  }

  function flattenSelectableRows(rows: TreeRow<T>[]): TreeRow<T>[] {
    const out: TreeRow<T>[] = [];
    for (const r of rows) {
      if (canSelectRow(r)) out.push(r);
      if (r.children?.length) {
        out.push(...flattenSelectableRows(r.children));
      }
    }
    return out;
  }

  function getSelectedRowIds(): string[] {
    const collected = new Set<string>();
    const data = unref(treeData);

    function collectRows(row: TreeRow<T>, includeAll: boolean): void {
      const isSelected = !!rowSelection.value[row.id];
      // If parent is selected (includeAll), implicitly select children?
      // The logic here seems to imply that selection propagates down.
      const shouldInclude = includeAll || isSelected;

      if (canSelectRow(row)) {
        if (shouldInclude) collected.add(row.id);
      }

      const children = row.children || [];
      // If this row is selected, we propagate selection to children?
      // Only if this row type implies grouping?
      // In the original code, if it was selectableType (container), we returned if not folder.
      // Here we just continue. If children are selectable, they will get selected if propagate is true.

      const propagate = shouldInclude;
      for (const child of children) {
        collectRows(child, propagate);
      }
    }

    for (const root of data) {
      collectRows(root, false);
    }

    return Array.from(collected);
  }

  function getSelectedEntryIds(): string[] {
    return Object.entries(rowSelection.value)
      .filter(([, selected]) => !!selected)
      .map(([id]) => id);
  }

  if (selectedIds) {
    watch(
      selectedIds,
      (newVal) => {
        const data = unref(treeData);
        const currentSelected = Object.entries(rowSelection.value)
          .filter(([, s]) => s)
          .map(([id]) => id);

        if (arraysEqualAsSets(newVal || [], currentSelected)) {
          return;
        }

        const target = new Set(newVal || []);
        const next: Record<string, boolean> = {};
        for (const r of flattenSelectableRows(data)) {
          next[r.id] = target.has(r.id);
        }
        rowSelection.value = next;
      },
      { immediate: true }
    );
  }

  watch(
    () => unref(treeData),
    (data) => {
      const valid = new Set(flattenSelectableRows(data).map((r) => r.id));
      const next: Record<string, boolean> = {};
      for (const [id, selected] of Object.entries(rowSelection.value)) {
        if (valid.has(id) && selected) next[id] = true;
      }
      rowSelection.value = next;
    },
    { deep: false }
  );

  return {
    rowSelection,
    getSelectedRowIds,
    getSelectedEntryIds,
    flattenSelectableRows,
  };
}
