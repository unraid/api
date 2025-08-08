<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  filterQuery?: string;
  groupBy?: string;
  selectedItems?: string[];
  showFilter?: boolean;
  showGrouping?: boolean;
  manageActions?: Array<Array<{ label: string; icon: string; onClick?: () => void }>>;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Docker Overview',
  filterQuery: '',
  groupBy: 'none',
  selectedItems: () => [],
  showFilter: true,
  showGrouping: true,
  manageActions: () => [
    [
      { label: 'Sort Alpha Asc', icon: 'i-lucide-arrow-up-a-z' },
      { label: 'Sort Alpha Dec', icon: 'i-lucide-arrow-down-z-a' },
    ],
    [
      { label: 'Start Selected', icon: 'i-lucide-play' },
      { label: 'Stop Selected', icon: 'i-lucide-square' },
      { label: 'Pause Selected', icon: 'i-lucide-pause' },
      { label: 'Restart Selected', icon: 'i-lucide-refresh-cw' },
      { label: 'Autostart Selected', icon: 'i-lucide-timer' },
    ],
    [
      { label: 'Check for Updates', icon: 'i-lucide-refresh-ccw' },
      { label: 'Update Selected', icon: 'i-lucide-download' },
      { label: 'Remove Selected', icon: 'i-lucide-trash-2' },
    ],
    [{ label: 'Add Container', icon: 'i-lucide-plus' }],
  ],
});

const emit = defineEmits<{
  'update:filterQuery': [query: string];
  'update:groupBy': [groupBy: string];
  add: [];
  selectAll: [];
  clearAll: [];
  manageAction: [action: string];
}>();

const selectedCount = computed(() => props.selectedItems?.length || 0);

const handleManageAction = (action: { label: string; icon: string }) => {
  emit('manageAction', action.label);
};

const dropdownItems = computed(() =>
  props.manageActions.map((group) =>
    group.map((action) => ({
      label: action.label,
      icon: action.icon,
      onSelect: () => handleManageAction(action),
    }))
  )
);
</script>

<template>
  <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div class="p-4 space-y-4">
      <!-- Title and Add Button -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h1>
        <UButton icon="i-lucide-plus" color="primary" variant="solid" @click="$emit('add')">
          Add Folder
        </UButton>
      </div>

      <!-- Controls Row -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <!-- Left Side: Filter and Configure View -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <!-- Filter Input -->
          <div v-if="showFilter" class="flex-1 max-w-sm">
            <UInput
              :model-value="filterQuery"
              placeholder="Filter"
              icon="i-lucide-search"
              size="md"
              @update:model-value="$emit('update:filterQuery', $event)"
            />
          </div>

          <!-- Configure View Dropdown -->
          <UButton
            v-if="showGrouping"
            color="primary"
            variant="outline"
            trailing-icon="i-lucide-chevron-down"
          >
            Configure View
          </UButton>
        </div>

        <!-- Right Side: Selection Controls -->
        <div class="flex items-center gap-3">
          <!-- Select All / Clear All -->
          <UButton
            variant="link"
            color="primary"
            size="sm"
            @click="selectedCount > 0 ? $emit('clearAll') : $emit('selectAll')"
          >
            {{ selectedCount > 0 ? 'Clear all' : 'Select all' }}
          </UButton>

          <!-- Manage Selected Dropdown -->
          <UDropdownMenu :items="dropdownItems" size="md">
            <UButton
              variant="outline"
              color="primary"
              trailing-icon="i-lucide-chevron-down"
              :disabled="selectedCount === 0"
            >
              Manage Selected ({{ selectedCount }})
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>
