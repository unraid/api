import { ref } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export type DropArea = 'before' | 'after' | 'inside';

export interface DragDropState {
  rowId: string;
  area: DropArea | null;
}

export interface DropEvent<T = unknown> {
  target: TreeRow<T>;
  area: DropArea;
  sourceIds: string[];
}

export interface DragDropOptions<T = unknown> {
  rowSelection?: Ref<Record<string, boolean>>;
  onDrop?: (event: DropEvent<T>) => void | Promise<void>;
}

export function useDragDrop<T = unknown>(options: DragDropOptions<T> = {}) {
  const { rowSelection, onDrop } = options;

  const draggingIds = ref<string[]>([]);
  const dragOverState = ref<DragDropState | null>(null);
  let rafId: number | null = null;

  function isDraggingId(id: string): boolean {
    return draggingIds.value.includes(id);
  }

  function computeDropArea(e: DragEvent, el: HTMLElement): DropArea {
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const threshold = Math.max(8, rect.height * 0.3);
    if (y < threshold) return 'before';
    if (y > rect.height - threshold) return 'after';
    return 'inside';
  }

  function handleDragStart(e: DragEvent, row: TreeRow<T>) {
    const selected = rowSelection?.value
      ? Object.entries(rowSelection.value)
          .filter(([, sel]) => sel)
          .map(([id]) => id)
      : [];

    const ids =
      selected.length && isDraggingId(row.id)
        ? selected
        : selected.length && rowSelection?.value?.[row.id]
          ? selected
          : [row.id];

    draggingIds.value = Array.from(new Set(ids));

    try {
      e.dataTransfer?.setData('text/plain', draggingIds.value.join(','));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      // ignore
    }
  }

  function handleDragOver(e: DragEvent, row: TreeRow<T>, element: HTMLElement) {
    if (!draggingIds.value.length) return;

    e.preventDefault();

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      const area = computeDropArea(e, element);
      dragOverState.value = { rowId: row.id, area };
      rafId = null;
    });
  }

  function handleDragLeave(rowId: string) {
    if (dragOverState.value?.rowId === rowId) {
      dragOverState.value = null;
    }
  }

  async function handleDrop(e: DragEvent, row: TreeRow<T>, element: HTMLElement) {
    e.preventDefault();

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    const area = computeDropArea(e, element);
    const ids = draggingIds.value.length
      ? draggingIds.value
      : (e.dataTransfer?.getData('text/plain') || '').split(',').filter(Boolean);

    if (ids.length && !ids.includes(row.id)) {
      await onDrop?.({ target: row, area, sourceIds: ids });
    }

    draggingIds.value = [];
    dragOverState.value = null;
  }

  function handleDragEnd() {
    draggingIds.value = [];
    dragOverState.value = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function getDragOverClass(rowId: string): string {
    const over = dragOverState.value?.rowId === rowId ? dragOverState.value.area : null;
    if (!over) return '';

    return over === 'before'
      ? 'border-t-2 border-primary'
      : over === 'after'
        ? 'border-b-2 border-primary'
        : 'ring-2 ring-primary/40';
  }

  return {
    draggingIds,
    dragOverState,
    isDraggingId,
    computeDropArea,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDragOverClass,
  };
}
