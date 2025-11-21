<script setup lang="ts" generic="T = unknown">
import { computed, h, ref, resolveComponent, watch } from 'vue';

import { useDragDrop } from '@/composables/useDragDrop';
import { useRowSelection } from '@/composables/useRowSelection';

import type { DropArea, DropEvent } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component, VNode, VNodeChild } from 'vue';

type SearchAccessor<T> = (row: TreeRow<T>) => unknown | unknown[];
type FlatRow<T> = TreeRow<T> & { depth: number; parentId?: string };
type TableInstanceRow<T> = {
  original: FlatRow<T>;
  depth?: number;
  getIsSelected: () => boolean;
  toggleSelected: (value: boolean) => void;
  getValue: (key: string) => unknown;
};
type EnhancedRow<T> = TableInstanceRow<T> & {
  depth: number;
  getIsExpanded: () => boolean;
  toggleExpanded: () => void;
};

interface Props {
  data: TreeRow<T>[];
  columns: TableColumn<TreeRow<T>>[];
  loading?: boolean;
  compact?: boolean;
  activeId?: string | null;
  selectedIds?: string[];
  selectableType?: string;
  enableDragDrop?: boolean;
  busyRowIds?: Set<string>;
  searchableKeys?: string[];
  searchAccessor?: SearchAccessor<T>;
  includeMetaInSearch?: boolean;
  // Allow parent to control expansion if needed (e.g. for persistent state)
  // But usually BaseTreeTable manages it for UI
  canExpand?: (row: TreeRow<T>) => boolean;
  canSelect?: (row: TreeRow<T>) => boolean;
  canDrag?: (row: TreeRow<T>) => boolean;
  canDropInside?: (row: TreeRow<T>) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
  activeId: null,
  selectedIds: () => [],
  // selectableType default removed
  enableDragDrop: false,
  busyRowIds: () => new Set(),
  // searchableKeys default removed, will handle in getter if needed or empty
  includeMetaInSearch: true,
});

const emit = defineEmits<{
  (e: 'row:click', payload: { id: string; type: string; name: string; meta?: T }): void;
  (
    e: 'row:select',
    payload: { id: string; type: string; name: string; selected: boolean; meta?: T }
  ): void;
  (
    e: 'row:contextmenu',
    payload: { id: string; type: string; name: string; meta?: T; event: MouseEvent }
  ): void;
  (e: 'row:drop', payload: DropEvent<T>): void;
  (e: 'update:selectedIds', value: string[]): void;
}>();

const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UTable = resolveComponent('UTable') as Component;

const treeDataRef = computed(() => props.data);
const selectedIdsRef = ref(props.selectedIds);

type ColumnHeaderRenderer = TableColumn<TreeRow<T>>['header'];

watch(
  () => props.selectedIds,
  (val) => {
    selectedIdsRef.value = val;
  }
);

// Helper functions for capabilities
function canSelectRow(row: TreeRow<T>): boolean {
  if (props.canSelect) return props.canSelect(row);
  if (props.selectableType) return row.type === props.selectableType;
  return false;
}

function canExpandRow(row: TreeRow<T>): boolean {
  if (props.canExpand) return props.canExpand(row);
  return !!(row.children && row.children.length);
}

function canDragRow(row: TreeRow<T>): boolean {
  if (props.canDrag) return props.canDrag(row);
  return props.enableDragDrop ?? false;
}

function canDropInsideRow(row: TreeRow<T>): boolean {
  if (props.canDropInside) return props.canDropInside(row);
  return false;
}

const { rowSelection, getSelectedRowIds, flattenSelectableRows } = useRowSelection<T>({
  selectedIds: selectedIdsRef,
  treeData: treeDataRef,
  selectableType: props.selectableType,
  isSelectable: canSelectRow,
});

const {
  handleDragStart,
  handleDragEnd: composableDragEnd,
  draggingIds,
} = useDragDrop<T>({
  rowSelection,
});

function handleDragEnd() {
  composableDragEnd();
  stableMetrics.value = [];
  projectionState.value = null;
}

watch(
  rowSelection,
  () => {
    emit('update:selectedIds', getSelectedRowIds());
  },
  { deep: true }
);

const globalFilter = ref('');
const columnVisibility = ref<Record<string, boolean>>({});
const filterTerm = computed(() => globalFilter.value.trim().toLowerCase());

// Internal expansion state since we are flattening manually
const expandedRowIds = ref<Set<string>>(new Set());
const tableContainerRef = ref<HTMLElement | null>(null);
const projectionState = ref<{ targetId: string; area: DropArea } | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stableMetrics = ref<any[]>([]);

function toggleExpanded(id: string) {
  // Force a new Set reference to trigger reactivity
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
    // Create a flat wrapper with depth info.
    const flatNode: FlatRow<T> = { ...node, depth, parentId };

    const result = [flatNode];
    if (node.children && node.children.length && expanded.has(node.id)) {
      result.push(...flattenTree(node.children, expanded, depth + 1, node.id));
    }
    return result;
  });
}

function setGlobalFilter(value: string) {
  globalFilter.value = value;
}

function collectSearchableStrings(input: unknown, seen = new Set<unknown>()): string[] {
  if (input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return [String(input)];
  }

  if (typeof input === 'boolean') {
    return [input ? 'true' : 'false'];
  }

  if (seen.has(input)) {
    return [];
  }

  seen.add(input);

  if (Array.isArray(input)) {
    return input.flatMap((value) => collectSearchableStrings(value, seen));
  }

  if (typeof input === 'object') {
    return Object.values(input as Record<string, unknown>).flatMap((value) =>
      collectSearchableStrings(value, seen)
    );
  }

  return [];
}

function getValueByKey<T>(row: TreeRow<T>, key: string): unknown {
  const segments = key.split('.');
  let current: unknown = row;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function toArray(value: unknown | unknown[]): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value !== undefined && value !== null ? [value] : [];
}

function getRowSearchValues(row: TreeRow<T>): string[] {
  const values: unknown[] = [];

  const keys = props.searchableKeys || ['id', 'name', 'type'];

  if (keys.length) {
    for (const key of keys) {
      const resolved = getValueByKey(row, key);
      if (resolved !== undefined && resolved !== null) {
        values.push(resolved);
      }
    }
  }

  if (props.searchAccessor) {
    try {
      values.push(...toArray(props.searchAccessor(row)));
    } catch (error) {
      if (import.meta?.env?.DEV) {
        console.warn('BaseTreeTable searchAccessor error', error);
      }
    }
  }

  if (props.includeMetaInSearch && row.meta) {
    values.push(row.meta);
  }

  return values
    .flatMap((value) => collectSearchableStrings(value, new Set()))
    .filter((str) => str.trim().length);
}

function rowMatchesTerm(row: TreeRow<T>, term: string): boolean {
  if (!term) return true;

  return getRowSearchValues(row)
    .map((value) => value.toLowerCase())
    .some((value) => value.includes(term));
}

function filterRowsByTerm(rows: TreeRow<T>[], term: string): TreeRow<T>[] {
  if (!term) {
    return rows;
  }

  return rows
    .map((row) => {
      const filteredChildren = row.children ? filterRowsByTerm(row.children, term) : [];
      const matches = rowMatchesTerm(row, term);
      if (!matches && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...row,
        children: row.children ? filteredChildren : undefined,
      } as TreeRow<T>;
    })
    .filter((row): row is TreeRow<T> => row !== null);
}

const filteredData = computed(() => {
  const term = filterTerm.value;
  let data = treeDataRef.value;

  if (term) {
    data = filterRowsByTerm(data, term);
  }

  return data;
});

// Ensure that flatVisibleRows is reactive to expandedRowIds
const flatVisibleRows = computed(() => {
  // Dependency on expandedRowIds.value is crucial here
  const expanded = expandedRowIds.value;
  return flattenTree(filteredData.value, expanded);
});
const flatRowMap = computed(() => {
  const entries = new Map<string, FlatRow<T>>();
  for (const row of flatVisibleRows.value) {
    entries.set(row.id, row);
  }
  return entries;
});

interface RowMetric {
  id: string;
  top: number;
  bottom: number;
  height: number;
  row: FlatRow<T>;
}

function collectRowMetrics(): RowMetric[] {
  const container = tableContainerRef.value;
  if (!container) return [];
  const elements = container.querySelectorAll<HTMLElement>('[data-row-id]');
  const metrics: RowMetric[] = [];
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

function updateProjectionFromPointer(event: DragEvent) {
  if (!draggingIds.value.length) return;

  const pointerY = event.clientY;
  let metrics = stableMetrics.value;

  if (!metrics.length) {
    metrics = collectRowMetrics();
    stableMetrics.value = metrics;
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

      // Use helper to check if we can drop inside
      if (canDropInsideRow(row) && relative >= lowerThreshold && relative <= upperThreshold) {
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

function handleContainerDragOver(event: DragEvent) {
  if (!props.enableDragDrop || !draggingIds.value.length) return;
  event.preventDefault();
  event.stopPropagation();
  updateProjectionFromPointer(event);
}

function handleContainerDrop(event: DragEvent) {
  if (!props.enableDragDrop || !draggingIds.value.length) return;
  event.preventDefault();
  event.stopPropagation();
  const state = projectionState.value;
  if (!state) return;
  const targetRow = flatRowMap.value.get(state.targetId);
  if (!targetRow) return;
  emit('row:drop', {
    target: targetRow,
    area: state.area,
    sourceIds: [...draggingIds.value],
  });
  rowSelection.value = {};
  handleDragEnd();
}

watch(draggingIds, (value, oldValue) => {
  if (!value.length) {
    projectionState.value = null;
    stableMetrics.value = [];
  }
  if (value.length && !oldValue?.length) {
    stableMetrics.value = [];
  }
});

const projectedData = computed(() => {
  return flatVisibleRows.value;
});

const tableRef = ref<{ tableApi?: unknown } | null>(null);

watch(
  () => props.compact,
  (isCompact) => {
    if (isCompact) {
      const hideColumns: Record<string, boolean> = {};
      props.columns.forEach((col) => {
        const key = ((col as { id?: string; accessorKey?: string }).id ||
          (col as { id?: string; accessorKey?: string }).accessorKey) as string;
        if (key && key !== 'select' && key !== 'name') {
          hideColumns[key] = false;
        }
      });
      columnVisibility.value = hideColumns;
    }
  },
  { immediate: true }
);

const selectedCount = computed(() => {
  return Object.values(rowSelection.value).filter(Boolean).length;
});

function wrapCellWithRow(
  row: { original: TreeRow<T>; depth?: number },
  cellContent: VNode,
  columnIndex: number
) {
  const isBusy = props.busyRowIds.has(row.original.id);
  const isActive = props.activeId !== null && props.activeId === row.original.id;
  const isDragging = props.enableDragDrop && draggingIds.value.includes(row.original.id);
  const isProjectionTarget = projectionState.value?.targetId === row.original.id;
  const projectionArea = projectionState.value?.area;

  let dragClass = '';
  let dropIndicator: VNode | null = null;

  if (props.enableDragDrop && isProjectionTarget) {
    if (projectionArea === 'inside') {
      dragClass = 'ring-2 ring-primary/50 bg-primary/5 z-10';
    } else if (columnIndex === 0 && (projectionArea === 'before' || projectionArea === 'after')) {
      const indicatorClass =
        projectionArea === 'before'
          ? 'absolute top-0 left-0 right-full h-0.5 bg-primary pointer-events-none z-[100]'
          : 'absolute bottom-0 left-0 right-full h-0.5 bg-primary pointer-events-none z-[100]';

      dropIndicator = h('div', {
        class: indicatorClass,
        ref: (el) => {
          if (el && el instanceof HTMLElement) {
            const cell = el.closest('td');
            const row = cell?.closest('tr');
            if (row && cell) {
              const rowWidth = row.offsetWidth;
              const cellLeft = cell.offsetLeft;
              el.style.width = `${rowWidth}px`;
              el.style.left = `-${cellLeft}px`;
            }
          }
        },
      });
    }
  }

  const children = dropIndicator ? [cellContent, dropIndicator] : [cellContent];

  // Check if this row can be dragged
  const draggable = props.enableDragDrop && canDragRow(row.original);

  const rowWrapper = h(
    'div',
    {
      'data-row-id': row.original.id,
      draggable,
      class: `relative block w-full h-full px-3 py-2 ${isBusy ? 'opacity-50 pointer-events-none select-none' : ''} ${
        isActive ? 'bg-primary-50 dark:bg-primary-950/30' : ''
      } ${canSelectRow(row.original) ? 'cursor-pointer' : ''} ${dragClass} ${
        isDragging ? 'opacity-30 pointer-events-none' : ''
      }`,
      onClick: (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          target.closest('input,button,textarea,a,[role=checkbox],[role=button],[data-stop-row-click]')
        ) {
          return;
        }
        const r = row.original;
        emit('row:click', { id: r.id, type: r.type, name: r.name, meta: r.meta });
      },
      onDragstart: props.enableDragDrop
        ? (e: DragEvent) => {
            if (isBusy) return;
            // If not draggable, don't start
            if (!draggable) {
              e.preventDefault();
              return;
            }
            handleDragStart(e, row.original);
          }
        : undefined,
      onDragend: props.enableDragDrop ? handleDragEnd : undefined,
      onContextmenu: (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          target.closest('input,button,textarea,a,[role=checkbox],[role=button],[data-stop-row-click]')
        ) {
          return;
        }
        e.preventDefault();
        const r = row.original;
        emit('row:contextmenu', { id: r.id, type: r.type, name: r.name, meta: r.meta, event: e });
      },
    },
    children
  );

  return rowWrapper;
}

function wrapHeaderContent(content: unknown): VNode {
  let normalized: VNodeChild | undefined;

  if (typeof content === 'number') {
    normalized = String(content);
  } else if (typeof content === 'boolean') {
    normalized = content ? 'true' : undefined;
  } else if (Array.isArray(content)) {
    normalized = content as VNodeChild;
  } else if (content !== null && content !== undefined) {
    normalized = content as VNodeChild;
  } else {
    normalized = undefined;
  }

  if (normalized === undefined || normalized === null) {
    return h('div', { class: 'px-3 py-2 flex items-center gap-2 text-left' });
  }

  return h('div', { class: 'px-3 py-2 flex items-center gap-2 text-left' }, normalized);
}

function wrapColumnHeaderRenderer(
  header: ColumnHeaderRenderer | undefined
): ColumnHeaderRenderer | undefined {
  if (typeof header === 'function') {
    return function wrappedHeaderRenderer(this: unknown, ...args: unknown[]) {
      const result = (header as (...args: unknown[]) => unknown).apply(this, args);
      return wrapHeaderContent(result);
    };
  }
  if (header !== undefined) {
    return () => wrapHeaderContent(header);
  }
  return undefined;
}

function createSelectColumn(): TableColumn<TreeRow<T>> {
  return {
    id: 'select',
    header: () => {
      if (props.compact) return '';
      // We use the projected data or filtered data?
      // Select all should probably operate on the full filtered set, not just what's projected?
      // But flattened rows are what we see.
      // Let's use flatVisibleRows for selection logic to be consistent with view.
      const visibleRows = flatVisibleRows.value;
      const containers = flattenSelectableRows(visibleRows);
      const totalSelectable = containers.length;
      const selectedIds = Object.entries(rowSelection.value)
        .filter(([, selected]) => selected)
        .map(([id]) => id);
      const selectedSet = new Set(selectedIds);
      const selectedCount = containers.reduce(
        (count, row) => (selectedSet.has(row.id) ? count + 1 : count),
        0
      );
      const allSelected = totalSelectable > 0 && selectedCount === totalSelectable;
      const someSelected = selectedCount > 0 && !allSelected;

      return wrapHeaderContent(
        h(UCheckbox, {
          modelValue: someSelected ? 'indeterminate' : allSelected,
          'onUpdate:modelValue': () => {
            const target = someSelected || allSelected ? false : true;
            const next = { ...rowSelection.value } as Record<string, boolean>;
            for (const row of containers) {
              if (target) {
                next[row.id] = true;
              } else {
                delete next[row.id];
              }
            }
            rowSelection.value = next;
          },
          'aria-label': 'Select all',
        })
      );
    },
    cell: ({ row }) => {
      const enhancedRow = enhanceRowInstance(row as unknown as TableInstanceRow<T>);
      if (canSelectRow(enhancedRow.original)) {
        return wrapCellWithRow(
          enhancedRow,
          h('span', { 'data-stop-row-click': 'true' }, [
            h(UCheckbox, {
              modelValue: enhancedRow.getIsSelected(),
              'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
                const next = !!value;
                enhancedRow.toggleSelected(next);
                const r = enhancedRow.original;
                emit('row:select', {
                  id: r.id,
                  type: r.type,
                  name: r.name,
                  selected: next,
                  meta: r.meta,
                });
              },
              'aria-label': 'Select row',
              role: 'checkbox',
              onClick: (e: Event) => e.stopPropagation(),
            }),
          ]),
          0
        );
      }
      // Use canExpandRow to determine if we show expansion button
      if (canExpandRow(enhancedRow.original)) {
        return wrapCellWithRow(
          enhancedRow,
          h(UButton, {
            color: 'neutral',
            size: 'md',
            variant: 'ghost',
            icon: 'i-lucide-chevron-down',
            square: true,
            'aria-label': 'Expand',
            class: 'p-0',
            ui: {
              leadingIcon: [
                'transition-transform mt-0.5 -rotate-90',
                enhancedRow.getIsExpanded() ? 'duration-200 rotate-0' : '',
              ],
            },
            onClick: (e: Event) => {
              e.stopPropagation();
              enhancedRow.toggleExpanded();
            },
          }),
          0
        );
      }
      return h('span');
    },
    enableSorting: false,
    enableHiding: false,
    meta: { class: { th: 'w-10', td: 'w-10' } },
  };
}

const processedColumns = computed<TableColumn<TreeRow<T>>[]>(() => {
  return [
    createSelectColumn(),
    ...props.columns.map((col, colIndex) => {
      const originalHeader = col.header as ColumnHeaderRenderer | undefined;
      const header = wrapColumnHeaderRenderer(originalHeader) ?? originalHeader;
      const cell = (col as { cell?: unknown }).cell
        ? ({ row }: { row: TableInstanceRow<T> }) => {
            const cellFn = (col as { cell: (args: unknown) => VNode | string | number }).cell;

            const enhancedRow = enhanceRowInstance(row as unknown as TableInstanceRow<T>);
            const content = typeof cellFn === 'function' ? cellFn({ row: enhancedRow }) : cellFn;
            return wrapCellWithRow(enhancedRow, content as VNode, colIndex + 1);
          }
        : undefined;

      return {
        ...col,
        header,
        cell,
      } as TableColumn<TreeRow<T>>;
    }),
  ];
});

defineExpose({
  tableRef,
  tableApi: computed(() => tableRef.value?.tableApi),
  rowSelection,
  selectedCount,
  globalFilter,
  columnVisibility,
  setGlobalFilter,
});

function enhanceRowInstance(row: TableInstanceRow<T>): EnhancedRow<T> {
  return {
    ...row,
    depth: (row.original?.depth ?? row.depth ?? 0) as number,
    getIsExpanded: () => expandedRowIds.value.has(row.original.id),
    toggleExpanded: () => toggleExpanded(row.original.id),
  };
}
</script>

<template>
  <div
    class="w-full"
    ref="tableContainerRef"
    @dragover.capture="handleContainerDragOver"
    @drop.capture="handleContainerDrop"
  >
    <slot
      name="toolbar"
      :selected-count="selectedCount"
      :global-filter="globalFilter"
      :column-visibility="columnVisibility"
      :row-selection="rowSelection"
      :set-global-filter="setGlobalFilter"
    >
      <div v-if="!compact" class="mb-3 flex items-center gap-2">
        <slot name="toolbar-start" />
        <slot name="toolbar-end" />
      </div>
    </slot>

    <UTable
      ref="tableRef"
      v-model:row-selection="rowSelection"
      v-model:column-visibility="columnVisibility"
      :data="projectedData"
      :columns="processedColumns"
      :get-row-id="(row: any) => row.id"
      :get-row-can-select="(row: any) => canSelectRow(row.original)"
      :column-filters-options="{ filterFromLeafRows: true }"
      :loading="loading"
      :ui="{ td: 'p-0 empty:p-0', thead: compact ? 'hidden' : '', th: compact ? 'hidden' : '' }"
      sticky
      class="base-tree-table flex-1 pb-2"
    />

    <div v-if="!loading && filteredData.length === 0" class="py-8 text-center text-gray-500">
      <slot name="empty">No items found</slot>
    </div>
  </div>
</template>

<style scoped>
.base-tree-table :deep(th) {
  padding: 0;
}

.base-tree-table :deep(td) {
  overflow: visible;
}

.base-tree-table :deep(tr) {
  position: relative;
}
</style>
