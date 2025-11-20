import { ref } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export type DropArea = 'before' | 'after' | 'inside';

export interface DropEvent<T = unknown> {
  target: TreeRow<T>;
  area: DropArea;
  sourceIds: string[];
}

export interface DragDropOptions<T = unknown> {
  rowSelection?: Ref<Record<string, boolean>>;
}

export function useDragDrop<T = unknown>(options: DragDropOptions<T> = {}) {
  const { rowSelection } = options;

  const draggingIds = ref<string[]>([]);

  function handleDragStart(e: DragEvent, row: TreeRow<T>) {
    const selected = rowSelection?.value
      ? Object.entries(rowSelection.value)
          .filter(([, sel]) => sel)
          .map(([id]) => id)
      : [];

    const isRowSelected = Boolean(rowSelection?.value?.[row.id]);
    const ids = selected.length && isRowSelected ? selected : [row.id];

    draggingIds.value = Array.from(new Set(ids));

    try {
      e.dataTransfer?.setData('text/plain', draggingIds.value.join(','));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      // ignore
    }
  }

  function handleDragEnd() {
    draggingIds.value = [];
  }

  return {
    draggingIds,
    handleDragStart,
    handleDragEnd,
  };
}
