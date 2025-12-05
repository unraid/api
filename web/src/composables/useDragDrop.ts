import { ref } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export type DropArea = 'before' | 'after' | 'inside';

export interface DropEvent<T = unknown> {
  target: TreeRow<T>;
  area: DropArea;
  sourceIds: string[];
}

export interface DragDropOptions {
  rowSelection?: Ref<Record<string, boolean>>;
}

export function useDragDrop<T = unknown>(options: DragDropOptions = {}) {
  const { rowSelection } = options;

  const draggingIds = ref<string[]>([]);

  function handleDragStart(e: DragEvent, row: TreeRow<T>) {
    const selected = rowSelection?.value
      ? Object.entries(rowSelection.value)
          .filter(([, sel]) => sel)
          .map(([id]) => id)
      : [];

    const isRowSelected = Boolean(rowSelection?.value?.[row.id]);
    const ids = Array.from(new Set(selected.length && isRowSelected ? selected : [row.id]));

    // Set dataTransfer synchronously (required by the API)
    try {
      e.dataTransfer?.setData('text/plain', ids.join(','));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      // ignore
    }

    // Defer state update to avoid DOM changes during dragstart
    // Chrome cancels drag if DOM is modified synchronously in dragstart handler
    // Note: queueMicrotask runs too soon; setTimeout(0) is required for Chrome (to use the macro task queue instead)
    setTimeout(() => {
      draggingIds.value = ids;
    }, 0);
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
