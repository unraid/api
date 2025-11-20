<script setup lang="ts">
import { computed, resolveComponent } from 'vue';

import type { ColumnVisibilityTableInstance } from '@/composables/usePersistentColumnVisibility';

interface Props {
  table: ColumnVisibilityTableInstance | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'change'): void;
}>();

const UDropdownMenu = resolveComponent('UDropdownMenu');
const UButton = resolveComponent('UButton');

const items = computed(() => {
  if (!props.table?.tableApi) return [[]];

  const availableColumns = props.table.tableApi.getAllColumns().filter((column) => column.getCanHide());

  const list = availableColumns.map((column) => {
    return {
      label: column.id,
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        props.table?.tableApi?.getColumn?.(column.id)?.toggleVisibility(!!checked);
        emit('change');
      },
      onSelect(e: Event) {
        e.preventDefault();
      },
    };
  });

  return [list];
});
</script>

<template>
  <UDropdownMenu :items="items" size="md" :ui="{ content: 'z-40' }">
    <UButton color="neutral" variant="outline" size="md" trailing-icon="i-lucide-chevron-down">
      Columns
    </UButton>
  </UDropdownMenu>
</template>
