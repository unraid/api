<script setup lang="ts" generic="T = unknown">
import { computed, h, ref, resolveComponent, watch } from 'vue';

import { useDragDrop } from '@/composables/useDragDrop';
import { useRowSelection } from '@/composables/useRowSelection';

import type { DropEvent } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component, VNode } from 'vue';

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
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
  activeId: null,
  selectedIds: () => [],
  selectableType: 'container',
  enableDragDrop: false,
  busyRowIds: () => new Set(),
});

const emit = defineEmits<{
  (e: 'row:click', payload: { id: string; type: string; name: string; meta?: T }): void;
  (
    e: 'row:select',
    payload: { id: string; type: string; name: string; selected: boolean; meta?: T }
  ): void;
  (e: 'row:drop', payload: DropEvent<T>): void;
  (e: 'update:selectedIds', value: string[]): void;
}>();

const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UTable = resolveComponent('UTable') as Component;

const treeDataRef = computed(() => props.data);
const selectedIdsRef = ref(props.selectedIds);

watch(
  () => props.selectedIds,
  (val) => {
    selectedIdsRef.value = val;
  }
);

const { rowSelection, getSelectedRowIds, flattenSelectableRows } = useRowSelection<T>({
  selectedIds: selectedIdsRef,
  treeData: treeDataRef,
  selectableType: props.selectableType,
});

const { handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, getDragOverClass } =
  useDragDrop<T>({
    rowSelection,
    onDrop: async (event) => {
      emit('row:drop', event);
      rowSelection.value = {};
    },
  });

watch(
  rowSelection,
  () => {
    emit('update:selectedIds', getSelectedRowIds());
  },
  { deep: true }
);

const globalFilter = ref('');
const columnVisibility = ref<Record<string, boolean>>({});
const tableRef = ref<{ table?: { getSelectedRowModel: () => { rows: unknown[] } } } | null>(null);

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

function wrapCellWithRow(row: { original: TreeRow<T>; depth?: number }, cellContent: VNode) {
  const isBusy = props.busyRowIds.has(row.original.id);
  const isActive = props.activeId !== null && props.activeId === row.original.id;
  const dragClass = props.enableDragDrop ? getDragOverClass(row.original.id) : '';

  const rowWrapper = h(
    'div',
    {
      'data-row-id': row.original.id,
      draggable:
        props.enableDragDrop && (row.original.type === 'container' || row.original.type === 'folder'),
      class: `block w-full h-full px-3 py-2 ${isBusy ? 'opacity-50 pointer-events-none select-none' : ''} ${
        isActive ? 'bg-primary-50 dark:bg-primary-950/30' : ''
      } ${row.original.type === 'container' ? 'cursor-pointer' : ''} ${dragClass}`,
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
            handleDragStart(e, row.original);
          }
        : undefined,
      onDragover: props.enableDragDrop
        ? (e: DragEvent) => {
            const targetEl = e.currentTarget as HTMLElement;
            handleDragOver(e, row.original, targetEl);
          }
        : undefined,
      onDragleave: props.enableDragDrop ? () => handleDragLeave(row.original.id) : undefined,
      onDrop: props.enableDragDrop
        ? async (e: DragEvent) => {
            const targetEl = e.currentTarget as HTMLElement;
            await handleDrop(e, row.original, targetEl);
          }
        : undefined,
      onDragend: props.enableDragDrop ? handleDragEnd : undefined,
    },
    [cellContent]
  );

  return rowWrapper;
}

function createSelectColumn(): TableColumn<TreeRow<T>> {
  return {
    id: 'select',
    header: () => {
      if (props.compact) return '';
      const containers = flattenSelectableRows(props.data);
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

      return h(UCheckbox, {
        modelValue: someSelected ? 'indeterminate' : allSelected,
        'onUpdate:modelValue': () => {
          const target = someSelected || allSelected ? false : true;
          const next: Record<string, boolean> = {};
          if (target) {
            for (const row of containers) next[row.id] = true;
          }
          rowSelection.value = next;
        },
        'aria-label': 'Select all',
      });
    },
    cell: ({ row }) => {
      if (row.original.type === props.selectableType) {
        return wrapCellWithRow(
          row,
          h('span', { 'data-stop-row-click': 'true' }, [
            h(UCheckbox, {
              modelValue: row.getIsSelected(),
              'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
                const next = !!value;
                row.toggleSelected(next);
                const r = row.original;
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
          ])
        );
      }
      if (row.original.type === 'folder') {
        return wrapCellWithRow(
          row,
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
                row.getIsExpanded() ? 'duration-200 rotate-0' : '',
              ],
            },
            onClick: (e: Event) => {
              e.stopPropagation();
              row.toggleExpanded();
            },
          })
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
    ...props.columns.map((col) => ({
      ...col,
      cell: (col as { cell?: unknown }).cell
        ? ({
            row,
          }: {
            row: {
              original: TreeRow<T>;
              depth?: number;
              getIsSelected: () => boolean;
              toggleSelected: (v: boolean) => void;
              getIsExpanded: () => boolean;
              toggleExpanded: () => void;
              getValue: (key: string) => unknown;
            };
          }) => {
            const cellFn = (col as { cell: (args: unknown) => VNode | string | number }).cell;
            const content = typeof cellFn === 'function' ? cellFn({ row }) : cellFn;
            return wrapCellWithRow(row, content as VNode);
          }
        : undefined,
    })),
  ];
});

defineExpose({
  tableRef,
  rowSelection,
  selectedCount,
});
</script>

<template>
  <div class="w-full">
    <slot
      name="toolbar"
      :selected-count="selectedCount"
      :global-filter="globalFilter"
      :column-visibility="columnVisibility"
      :row-selection="rowSelection"
    >
      <div v-if="!compact" class="mb-3 flex items-center gap-2">
        <slot name="toolbar-start" />
        <slot name="toolbar-end" />
      </div>
    </slot>

    <UTable
      ref="tableRef"
      v-model:row-selection="rowSelection"
      v-model:global-filter="globalFilter"
      v-model:column-visibility="columnVisibility"
      :data="data"
      :columns="processedColumns"
      :get-row-id="(row: any) => row.id"
      :get-sub-rows="(row: any) => row.children"
      :get-row-can-select="(row: any) => row.original.type === selectableType"
      :column-filters-options="{ filterFromLeafRows: true }"
      :loading="loading"
      :ui="{ td: 'p-0 empty:p-0', thead: compact ? 'hidden' : '', th: compact ? 'hidden' : '' }"
      sticky
      class="flex-1 pb-2"
    />

    <div v-if="!loading && data.length === 0" class="py-8 text-center text-gray-500">
      <slot name="empty">No items found</slot>
    </div>
  </div>
</template>
