<script setup lang="ts">
import { computed, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

import { useColumnDragDrop } from '@/composables/useColumnDragDrop';

import type { ColumnVisibilityTableInstance } from '@/composables/usePersistentColumnVisibility';

interface Props {
  table: ColumnVisibilityTableInstance | null;
  columnOrder?: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'update:columnOrder', value: string[]): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});

const columnOrderState = ref<string[]>([]);

const orderedColumns = computed(() => {
  if (!props.table?.tableApi) return [];

  const availableColumns = props.table.tableApi.getAllColumns().filter((column) => column.getCanHide());
  const columnIds = availableColumns.map((col) => col.id);

  const order = props.columnOrder && props.columnOrder.length > 0 ? props.columnOrder : columnIds;
  columnOrderState.value = order;

  const columnMap = new Map(availableColumns.map((col) => [col.id, col]));

  const ordered = order
    .map((id) => columnMap.get(id))
    .filter((col): col is NonNullable<typeof col> => col !== undefined);

  const missing = availableColumns.filter((col) => !order.includes(col.id));

  return [...ordered, ...missing];
});

const {
  draggingColumnId,
  dragOverColumnId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
} = useColumnDragDrop({
  columnOrder: columnOrderState,
  onReorder: (newOrder) => {
    emit('update:columnOrder', newOrder);
    emit('change');
  },
});

function toggleColumnVisibility(columnId: string, checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate') return;
  props.table?.tableApi?.getColumn?.(columnId)?.toggleVisibility(checked);
  emit('change');
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      trailing-icon="i-lucide-chevron-down"
      @click="toggleDropdown"
    >
      Columns
    </UButton>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="ring-opacity-5 absolute left-0 z-10 mt-2 min-w-[220px] origin-top-right overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none dark:bg-gray-800"
      >
        <div class="py-1">
          <div
            v-for="column in orderedColumns"
            :key="column.id"
            :draggable="true"
            :class="[
              'flex cursor-move items-center gap-2 px-3 py-2 transition-colors select-none hover:bg-gray-50 dark:hover:bg-gray-700',
              draggingColumnId === column.id && 'opacity-50',
              dragOverColumnId === column.id && 'bg-primary-50 dark:bg-primary-900/20',
            ]"
            @dragstart="(e: DragEvent) => handleDragStart(e, column.id)"
            @dragend="handleDragEnd"
            @dragover="(e: DragEvent) => handleDragOver(e, column.id)"
            @drop="(e: DragEvent) => handleDrop(e, column.id)"
          >
            <UIcon name="i-lucide-grip-vertical" class="h-4 w-4 text-gray-400" />
            <UCheckbox
              :model-value="column.getIsVisible()"
              @update:model-value="
                (checked: boolean | 'indeterminate') => toggleColumnVisibility(column.id, checked)
              "
              @click.stop
            />
            <span class="flex-1 text-sm">{{ column.id }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
