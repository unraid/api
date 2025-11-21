import { ref, watch } from 'vue';

import type { DropArea } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

type FlatRow<T> = TreeRow<T> & { depth: number; parentId?: string };

interface RowMetric<T> {
  id: string;
  top: number;
  bottom: number;
  height: number;
  row: FlatRow<T>;
}

interface UseDropProjectionOptions<T> {
  draggingIds: Ref<string[]>;
  flatRowMap: Ref<Map<string, FlatRow<T>>>;
  tableContainerRef: Ref<HTMLElement | null>;
  canDropInside: (row: TreeRow<T>) => boolean;
}

export function useDropProjection<T>({
  draggingIds,
  flatRowMap,
  tableContainerRef,
  canDropInside,
}: UseDropProjectionOptions<T>) {
  const projectionState = ref<{ targetId: string; area: DropArea } | null>(null);
  let stableMetrics: RowMetric<T>[] = [];

  function collectRowMetrics(): RowMetric<T>[] {
    const container = tableContainerRef.value;
    if (!container) return [];

    const elements = container.querySelectorAll<HTMLElement>('[data-row-id]');
    const metrics: RowMetric<T>[] = [];

    for (const element of elements) {
      const id = element.dataset.rowId;
      if (!id) continue;

      const row = flatRowMap.value.get(id);
      if (!row) continue;

      const rect = element.getBoundingClientRect();
      metrics.push({
        id,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height || 1,
        row,
      });
    }

    return metrics;
  }

  function updateProjectionFromPointer(pointerY: number) {
    if (!draggingIds.value.length) return;

    let metrics = stableMetrics;

    if (!metrics.length) {
      metrics = collectRowMetrics();
      stableMetrics = metrics;
    }

    if (!metrics.length) return;

    const draggingSet = new Set(draggingIds.value);
    const nonDraggingMetrics = metrics.filter((m) => !draggingSet.has(m.id));

    if (!nonDraggingMetrics.length) return;

    let targetMetric = nonDraggingMetrics[0];
    let area: DropArea = 'before';

    for (let i = 0; i < nonDraggingMetrics.length; i++) {
      const metric = nonDraggingMetrics[i];
      const { top, bottom, height, row } = metric;

      if (pointerY < top) {
        targetMetric = metric;
        area = 'before';
        break;
      }

      if (pointerY >= top && pointerY <= bottom) {
        const relative = pointerY - top;
        const lowerThreshold = height * 0.25;
        const upperThreshold = height * 0.75;

        if (canDropInside(row) && relative >= lowerThreshold && relative <= upperThreshold) {
          area = 'inside';
        } else if (relative < height * 0.5) {
          area = 'before';
        } else {
          area = 'after';
        }
        targetMetric = metric;
        break;
      }

      if (i === nonDraggingMetrics.length - 1) {
        targetMetric = metric;
        area = 'after';
      }
    }

    projectionState.value = { targetId: targetMetric.id, area };
  }

  function clearProjection() {
    projectionState.value = null;
    stableMetrics = [];
  }

  watch(draggingIds, (value, oldValue) => {
    if (!value.length) {
      clearProjection();
    }
    if (value.length && !oldValue?.length) {
      stableMetrics = [];
    }
  });

  return {
    projectionState,
    updateProjectionFromPointer,
    clearProjection,
  };
}
