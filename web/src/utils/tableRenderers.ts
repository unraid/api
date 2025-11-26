import { h } from 'vue';

import type { DropArea } from '@/composables/useDragDrop';
import type { TreeRow } from '@/composables/useTreeData';
import type { HeaderContext } from '@tanstack/vue-table';
import type { Component, VNode, VNodeChild } from 'vue';

type FlatRow<T> = TreeRow<T> & { depth: number; parentId?: string };

export function wrapHeaderContent(content: unknown, context?: HeaderContext<unknown, unknown>): VNode {
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

  const children: VNodeChild[] = [];
  if (normalized !== undefined && normalized !== null) {
    children.push(normalized);
  }

  if (context && context.column.getCanResize()) {
    children.push(
      h(
        'div',
        {
          onMousedown: context.header.getResizeHandler(),
          onTouchstart: context.header.getResizeHandler(),
          onClick: (e: Event) => e.stopPropagation(),
          class: `absolute -right-1 top-0 h-full w-2 cursor-col-resize touch-none select-none z-10 flex justify-center transition-colors ${
            context.header.column.getIsResizing()
              ? 'bg-primary'
              : 'hover:bg-primary/50 bg-gray-400/10 dark:bg-gray-600/10'
          }`,
        },
        [
          // Visual handle line (optional, maybe just background is enough, but let's add a thin line for precision feel)
          h('div', { class: 'w-px h-full bg-transparent' }),
          // Full height guide line
          context.header.column.getIsResizing()
            ? h('div', {
                class: 'fixed top-0 w-px h-screen bg-primary pointer-events-none z-[100]',
              })
            : null,
        ]
      )
    );
  }

  return h(
    'div',
    {
      class: 'px-3 py-2 flex items-center gap-2 text-left relative group h-full',
      style: context ? { width: `${context.column.getSize()}px` } : undefined,
    },
    children
  );
}

export interface DropIndicatorOptions<T> {
  row: FlatRow<T>;
  projectionArea: DropArea;
  columnIndex: number;
}

export function createDropIndicator<T>({
  row,
  projectionArea,
  columnIndex,
}: DropIndicatorOptions<T>): VNode | null {
  if (columnIndex !== 0) return null;

  if (projectionArea === 'inside') {
    return h('div', {
      key: `drop-indicator-${row.id}-inside`,
      class: 'absolute ring-2 ring-inset ring-primary/50 bg-primary/5 pointer-events-none z-[100]',
      ref: (el) => {
        if (el && el instanceof HTMLElement) {
          const cell = el.closest('td');
          const tr = cell?.closest('tr');
          if (tr && cell) {
            const rowWidth = tr.offsetWidth;
            const rowHeight = tr.offsetHeight;
            const cellLeft = cell.offsetLeft;
            const wrapperRect = el.parentElement?.getBoundingClientRect();
            const rowRect = tr.getBoundingClientRect();
            const topOffset = wrapperRect ? wrapperRect.top - rowRect.top : 0;
            el.style.cssText = `width: ${rowWidth}px; height: ${rowHeight}px; left: -${cellLeft}px; top: -${topOffset}px;`;
          }
        }
      },
    });
  }

  if (projectionArea === 'before' || projectionArea === 'after') {
    const indicatorClass =
      projectionArea === 'before'
        ? 'absolute top-0 left-0 right-full h-0.5 bg-primary pointer-events-none z-[100]'
        : 'absolute bottom-0 left-0 right-full h-0.5 bg-primary pointer-events-none z-[100]';

    return h('div', {
      key: `drop-indicator-${row.id}-${projectionArea}`,
      class: indicatorClass,
      ref: (el) => {
        if (el && el instanceof HTMLElement) {
          const cell = el.closest('td');
          const row = cell?.closest('tr');
          if (row && cell) {
            const rowWidth = row.offsetWidth;
            const cellLeft = cell.offsetLeft;
            el.style.cssText = `width: ${rowWidth}px; left: -${cellLeft}px;`;
          }
        }
      },
    });
  }

  return null;
}

export interface WrapCellOptions<T> {
  row: FlatRow<T>;
  cellContent: VNode;
  columnIndex: number;
  isBusy: boolean;
  isActive: boolean;
  isDragging: boolean;
  draggable: boolean;
  isSelectable: boolean;
  dropIndicator: VNode | null;
  enableDragDrop: boolean;
  onRowClick: (id: string, type: string, name: string, meta?: T) => void;
  onRowContextMenu: (
    id: string,
    type: string,
    name: string,
    meta: T | undefined,
    event: MouseEvent
  ) => void;
  onDragStart?: (e: DragEvent, row: FlatRow<T>) => void;
  onDragEnd?: () => void;
}

export function wrapCellWithRow<T>({
  row,
  cellContent,
  columnIndex,
  isBusy,
  isActive,
  isDragging,
  draggable,
  isSelectable,
  dropIndicator,
  enableDragDrop,
  onRowClick,
  onRowContextMenu,
  onDragStart,
  onDragEnd,
}: WrapCellOptions<T>): VNode {
  const children = dropIndicator ? [cellContent, dropIndicator] : [cellContent];

  return h(
    'div',
    {
      ...(columnIndex === 0 ? { 'data-row-id': row.id } : {}),
      class: `relative block w-full h-full px-3 py-2 ${isBusy ? 'opacity-50 pointer-events-none select-none' : ''} ${
        isActive ? 'bg-primary-50 dark:bg-primary-950/30' : ''
      } ${isSelectable ? 'cursor-pointer' : ''} ${isDragging ? 'opacity-30 pointer-events-none' : ''}`,
      onClick: (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          target.closest('input,button,textarea,a,[role=checkbox],[role=button],[data-stop-row-click]')
        ) {
          return;
        }
        onRowClick(row.id, row.type, row.name, row.meta);
      },
      onMousedown: enableDragDrop
        ? (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-drag-handle]') && draggable && !isBusy) {
              const wrapper = e.currentTarget as HTMLElement;
              wrapper.setAttribute('draggable', 'true');
            }
          }
        : undefined,
      onMouseup: enableDragDrop
        ? (e: MouseEvent) => {
            const wrapper = e.currentTarget as HTMLElement;
            wrapper.removeAttribute('draggable');
          }
        : undefined,
      onMouseleave: enableDragDrop
        ? (e: MouseEvent) => {
            const wrapper = e.currentTarget as HTMLElement;
            if (!isDragging) {
              wrapper.removeAttribute('draggable');
            }
          }
        : undefined,
      onDragstart: enableDragDrop
        ? (e: DragEvent) => {
            if (isBusy || !draggable) {
              e.preventDefault();
              return;
            }
            onDragStart?.(e, row);
          }
        : undefined,
      onDragend: enableDragDrop
        ? (e: DragEvent) => {
            const wrapper = e.currentTarget as HTMLElement;
            wrapper.removeAttribute('draggable');
            onDragEnd?.();
          }
        : undefined,
      onContextmenu: (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          target.closest('input,button,textarea,a,[role=checkbox],[role=button],[data-stop-row-click]')
        ) {
          return;
        }
        e.preventDefault();
        onRowContextMenu(row.id, row.type, row.name, row.meta, e);
      },
    },
    children
  );
}

export interface SelectColumnOptions<T> {
  UCheckbox: Component;
  UButton: Component;
  compact: boolean;
  flatVisibleRows: FlatRow<T>[];
  rowSelection: Record<string, boolean>;
  canSelectRow: (row: TreeRow<T>) => boolean;
  canExpandRow: (row: TreeRow<T>) => boolean;
  flattenSelectableRows: (rows: FlatRow<T>[]) => TreeRow<T>[];
  onSelectionChange: (selection: Record<string, boolean>) => void;
  onRowSelect: (id: string, type: string, name: string, selected: boolean, meta?: T) => void;
  wrapCell: (
    row: { original: FlatRow<T>; depth?: number },
    cellContent: VNode,
    columnIndex: number
  ) => VNode;
  getIsExpanded: (id: string) => boolean;
  toggleExpanded: (id: string) => void;
  getIsSelected: (id: string) => boolean;
  toggleSelected: (id: string, value: boolean) => void;
  getSelectableDescendants: (row: TreeRow<T>) => TreeRow<T>[];
}

export function createSelectColumnCell<T>(
  row: { original: FlatRow<T>; depth?: number },
  options: SelectColumnOptions<T>
): VNode {
  const {
    UCheckbox,
    canSelectRow,
    canExpandRow,
    onRowSelect,
    wrapCell,
    getIsSelected,
    toggleSelected,
    getSelectableDescendants,
    rowSelection,
    onSelectionChange,
  } = options;

  if (canSelectRow(row.original)) {
    return wrapCell(
      row,
      h('span', { 'data-stop-row-click': 'true' }, [
        h(UCheckbox, {
          modelValue: getIsSelected(row.original.id),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
            const next = !!value;
            toggleSelected(row.original.id, next);
            onRowSelect(row.original.id, row.original.type, row.original.name, next, row.original.meta);
          },
          'aria-label': 'Select row',
          role: 'checkbox',
          onClick: (e: Event) => e.stopPropagation(),
        }),
      ]),
      0
    );
  }

  if (canExpandRow(row.original)) {
    const descendants = getSelectableDescendants(row.original);
    const selectedCount = descendants.filter((d) => rowSelection[d.id]).length;
    const totalCount = descendants.length;

    const allSelected = totalCount > 0 && selectedCount === totalCount;
    const someSelected = selectedCount > 0 && !allSelected;
    const checkboxState = someSelected ? 'indeterminate' : allSelected;

    return wrapCell(
      row,
      h('span', { 'data-stop-row-click': 'true' }, [
        h(UCheckbox, {
          modelValue: checkboxState,
          'onUpdate:modelValue': () => {
            const targetState = someSelected || allSelected ? false : true;
            const next = { ...rowSelection };

            for (const descendant of descendants) {
              if (targetState) {
                next[descendant.id] = true;
              } else {
                delete next[descendant.id];
              }
            }

            onSelectionChange(next);

            if (descendants.length > 0) {
              const firstDescendant = descendants[0];
              onRowSelect(
                firstDescendant.id,
                firstDescendant.type,
                firstDescendant.name,
                targetState,
                firstDescendant.meta
              );
            }
          },
          'aria-label': 'Select all children',
          role: 'checkbox',
          onClick: (e: Event) => e.stopPropagation(),
        }),
      ]),
      0
    );
  }

  return h('span');
}
