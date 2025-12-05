import { ref } from 'vue';

import type { Ref } from 'vue';

export interface ColumnDragDropOptions {
  columnOrder: Ref<string[]>;
  onReorder: (newOrder: string[]) => void;
}

export function useColumnDragDrop(options: ColumnDragDropOptions) {
  const { columnOrder, onReorder } = options;

  const draggingColumnId = ref<string | null>(null);
  const dragOverColumnId = ref<string | null>(null);

  function handleDragStart(e: DragEvent, columnId: string) {
    draggingColumnId.value = columnId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', columnId);
    }
  }

  function handleDragEnd() {
    draggingColumnId.value = null;
    dragOverColumnId.value = null;
  }

  function handleDragOver(e: DragEvent, targetColumnId: string) {
    e.preventDefault();
    if (!draggingColumnId.value || draggingColumnId.value === targetColumnId) return;

    dragOverColumnId.value = targetColumnId;

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e: DragEvent, targetColumnId: string) {
    e.preventDefault();

    const sourceColumnId = draggingColumnId.value;
    if (!sourceColumnId || sourceColumnId === targetColumnId) {
      handleDragEnd();
      return;
    }

    const newOrder = [...columnOrder.value];
    const sourceIndex = newOrder.indexOf(sourceColumnId);
    const targetIndex = newOrder.indexOf(targetColumnId);

    if (sourceIndex === -1 || targetIndex === -1) {
      handleDragEnd();
      return;
    }

    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceColumnId);

    onReorder(newOrder);
    handleDragEnd();
  }

  return {
    draggingColumnId,
    dragOverColumnId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
