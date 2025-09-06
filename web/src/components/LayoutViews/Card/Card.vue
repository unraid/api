<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Component } from 'vue';

import CardGrid from '~/components/LayoutViews/Card/CardGrid.vue';
import CardHeader from '~/components/LayoutViews/Card/CardHeader.vue';

export interface Item {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  slot?: string;
  status?: {
    label: string;
    dotColor: string;
  }[];
  children?: Item[];
  isGroup?: boolean;
}

export interface TabItem {
  key: string;
  label: string;
  component?: Component;
  props?: Record<string, unknown>;
  disabled?: boolean;
}

interface Props {
  items?: Item[];
  defaultItemId?: string;
  navigationLabel?: string;
  showFilter?: boolean;
  showGrouping?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  defaultItemId: undefined,
  navigationLabel: 'Docker Overview',
  showFilter: true,
  showGrouping: true,
});

const selectedItemId = ref(props.defaultItemId || props.items[0]?.id || '');
const selectedItems = ref<string[]>([]);
const expandedGroups = ref<Record<string, boolean>>({});
const filterQuery = ref('');
const groupBy = ref<string>('none');
const autostartStates = ref<Record<string, boolean>>({});
const runningStates = ref<Record<string, boolean>>({});

// Initialize expanded state for groups
const initializeExpandedState = () => {
  props.items.forEach((item) => {
    if (item.isGroup) {
      expandedGroups.value[item.id] = true;
    }
  });
};

initializeExpandedState();

watch(
  () => props.items,
  () => {
    initializeExpandedState();
  },
  { deep: true }
);

const filteredItems = computed(() => {
  if (!filterQuery.value) return props.items;

  const query = filterQuery.value.toLowerCase();
  return props.items.filter((item) => {
    const matchesItem = item.label.toLowerCase().includes(query);
    const matchesChildren = item.children?.some((child) => child.label.toLowerCase().includes(query));
    return matchesItem || matchesChildren;
  });
});

const groupedItems = computed(() => {
  if (groupBy.value === 'none') {
    return filteredItems.value;
  }

  // For now, return items as-is since grouping logic depends on data structure
  return filteredItems.value;
});

// Reusable function to collect all selectable items
const collectSelectableItems = (items: Item[]): string[] => {
  const selectableItems: string[] = [];

  const collect = (items: Item[]) => {
    for (const item of items) {
      if (!item.isGroup) {
        selectableItems.push(item.id);
      }

      if (item.children) {
        collect(item.children);
      }
    }
  };

  collect(items);

  return selectableItems;
};

const selectAllItems = () => {
  selectedItems.value = [...collectSelectableItems(props.items)];
};

const clearAllSelections = () => {
  selectedItems.value = [];
};

const handleAddAction = () => {
  console.log('Add action triggered');
};

const handleManageSelectedAction = (action: string) => {
  console.log('Manage selected action:', action);
};

const handleItemSelect = (itemId: string) => {
  selectedItemId.value = itemId;
};

const handleItemsSelectionUpdate = (items: string[]) => {
  selectedItems.value = items;
};

const handleAutostartUpdate = (itemId: string, value: boolean) => {
  console.log('Autostart update for item:', itemId, 'value:', value);
  autostartStates.value[itemId] = value;
};

const handleToggleRunning = (itemId: string) => {
  // TODO: Wire up to actual docker/VM start/stop API
  const currentState = runningStates.value[itemId] || false;
  runningStates.value[itemId] = !currentState;
  console.log('Toggle running for item:', itemId, 'new state:', !currentState);
};
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <CardHeader
      :title="navigationLabel"
      :filter-query="filterQuery"
      :group-by="groupBy"
      :selected-items="selectedItems"
      :show-filter="showFilter"
      :show-grouping="showGrouping"
      @update:filter-query="filterQuery = $event"
      @update:group-by="groupBy = $event"
      @add="handleAddAction"
      @select-all="selectAllItems"
      @clear-all="clearAllSelections"
      @manage-action="handleManageSelectedAction"
    />

    <!-- Card Grid -->
    <div class="w-full flex-1 overflow-auto">
      <CardGrid
        :items="groupedItems"
        :selected-items="selectedItems"
        :selected-item-id="selectedItemId"
        :expanded-groups="expandedGroups"
        :autostart-states="autostartStates"
        :running-states="runningStates"
        @update:selected-items="handleItemsSelectionUpdate"
        @update:expanded-groups="expandedGroups = $event"
        @item-select="handleItemSelect"
        @update:autostart="handleAutostartUpdate"
        @toggle-running="handleToggleRunning"
      />
    </div>
  </div>
</template>
