import { computed, ref } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

type FlatRow<T> = TreeRow<T> & { depth: number; parentId?: string };

interface UseTreeExpansionOptions<T> {
  data: Ref<TreeRow<T>[]>;
}

export function useTreeExpansion<T>({ data }: UseTreeExpansionOptions<T>) {
  const expandedRowIds = ref<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    const next = new Set(expandedRowIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedRowIds.value = next;
  }

  function flattenTree(
    nodes: TreeRow<T>[],
    expanded: Set<string>,
    depth = 0,
    parentId?: string
  ): FlatRow<T>[] {
    return nodes.flatMap((node) => {
      const flatNode: FlatRow<T> = { ...node, depth, parentId };
      const result = [flatNode];

      if (node.children && node.children.length && expanded.has(node.id)) {
        result.push(...flattenTree(node.children, expanded, depth + 1, node.id));
      }

      return result;
    });
  }

  const flattenedData = computed(() => flattenTree(data.value, expandedRowIds.value));

  const flatRowMap = computed(() => {
    const entries = new Map<string, FlatRow<T>>();
    for (const row of flattenedData.value) {
      entries.set(row.id, row);
    }
    return entries;
  });

  return {
    expandedRowIds,
    toggleExpanded,
    flattenedData,
    flatRowMap,
  };
}
