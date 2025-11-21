<script setup lang="ts" generic="T = unknown">
import { computed, h, ref, resolveComponent, watch } from 'vue';

import { useDragDrop } from '@/composables/useDragDrop';
import { useDropProjection } from '@/composables/useDropProjection';
import { getSelectableDescendants, useRowSelection } from '@/composables/useRowSelection';
import { useTreeExpansion } from '@/composables/useTreeExpansion';
import { useTreeFilter } from '@/composables/useTreeFilter';
import {
  createDropIndicator,
  createSelectColumnCell,
  wrapCellWithRow,
  wrapHeaderContent,
} from '@/utils/tableRenderers';

import type { DropEvent } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component, VNode } from 'vue';

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
const tableContainerRef = ref<HTMLElement | null>(null);
const columnVisibility = ref<Record<string, boolean>>({});

type ColumnHeaderRenderer = TableColumn<TreeRow<T>>['header'];

watch(
  () => props.selectedIds,
  (val) => {
    selectedIdsRef.value = val;
  }
);

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

const { globalFilter, filteredData, setGlobalFilter } = useTreeFilter<T>({
  data: treeDataRef,
  searchableKeys: props.searchableKeys,
  searchAccessor: props.searchAccessor,
  includeMetaInSearch: props.includeMetaInSearch,
});

const { expandedRowIds, toggleExpanded, flattenedData, flatRowMap } = useTreeExpansion<T>({
  data: filteredData,
});

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

const { projectionState, clearProjection, updateProjectionFromPointer } = useDropProjection<T>({
  draggingIds,
  flatRowMap,
  tableContainerRef,
  canDropInside: canDropInsideRow,
});

function handleDragEnd() {
  composableDragEnd();
  clearProjection();
}

watch(
  rowSelection,
  () => {
    emit('update:selectedIds', getSelectedRowIds());
  },
  { deep: true }
);

watch(
  () => props.activeId,
  (activeId) => {
    if (activeId) {
      const parentFolderIds = findParentFolderIds(activeId, filteredData.value);
      if (parentFolderIds) {
        for (const folderId of parentFolderIds) {
          if (!expandedRowIds.value.has(folderId)) {
            toggleExpanded(folderId);
          }
        }
      }
    }
  },
  { immediate: true }
);

function handleContainerDragOver(event: DragEvent) {
  if (!props.enableDragDrop || !draggingIds.value.length) return;
  event.preventDefault();
  event.stopPropagation();
  updateProjectionFromPointer(event.clientY);
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

function createCellWrapper(
  row: { original: FlatRow<T>; depth?: number },
  cellContent: VNode,
  columnIndex: number
) {
  const isBusy = props.busyRowIds.has(row.original.id);
  const isActive = props.activeId !== null && props.activeId === row.original.id;
  const isDragging = props.enableDragDrop && draggingIds.value.includes(row.original.id);
  const isProjectionTarget = projectionState.value?.targetId === row.original.id;
  const projectionArea = projectionState.value?.area;
  const draggable = props.enableDragDrop && canDragRow(row.original);

  const dropIndicator =
    props.enableDragDrop && isProjectionTarget && projectionArea
      ? createDropIndicator({ row: row.original, projectionArea, columnIndex })
      : null;

  return wrapCellWithRow({
    row: row.original,
    cellContent,
    columnIndex,
    isBusy,
    isActive,
    isDragging,
    draggable,
    isSelectable: canSelectRow(row.original),
    dropIndicator,
    enableDragDrop: props.enableDragDrop,
    onRowClick: (id, type, name, meta) => {
      emit('row:click', { id, type, name, meta });
    },
    onRowContextMenu: (id, type, name, meta, event) => {
      emit('row:contextmenu', { id, type, name, meta, event });
    },
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  });
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

      const visibleRows = flattenedData.value;
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
      return createSelectColumnCell(enhancedRow, {
        UCheckbox: UCheckbox as Component,
        UButton: UButton as Component,
        compact: props.compact,
        flatVisibleRows: flattenedData.value,
        rowSelection: rowSelection.value,
        canSelectRow,
        canExpandRow,
        flattenSelectableRows,
        onSelectionChange: (selection) => {
          rowSelection.value = selection;
        },
        onRowSelect: (id, type, name, selected, meta) => {
          emit('row:select', { id, type, name, selected, meta });
        },
        wrapCell: createCellWrapper,
        getIsExpanded: (id) => expandedRowIds.value.has(id),
        toggleExpanded,
        getIsSelected: (id) => !!rowSelection.value[id],
        toggleSelected: (id, value) => {
          if (value) {
            rowSelection.value = { ...rowSelection.value, [id]: true };
          } else {
            const next = { ...rowSelection.value };
            delete next[id];
            rowSelection.value = next;
          }
        },
        getSelectableDescendants: (row) => getSelectableDescendants(row, canSelectRow),
      });
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
            return createCellWrapper(enhancedRow, content as VNode, colIndex + 1);
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

function findParentFolderIds(
  targetId: string,
  rows: TreeRow<T>[],
  path: string[] = []
): string[] | null {
  for (const row of rows) {
    if (row.id === targetId) {
      return path;
    }
    if (row.children && row.children.length) {
      const newPath = row.type === 'folder' ? [...path, row.id] : path;
      const found = findParentFolderIds(targetId, row.children, newPath);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

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
      :data="flattenedData"
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
