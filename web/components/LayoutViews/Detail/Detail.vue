<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Component } from 'vue';

import HeaderContent from '../../Docker/HeaderContent.vue';
import DetailContentHeader from './DetailContentHeader.vue';
import DetailLeftNavigation from './DetailLeftNavigation.vue';
import DetailRightContent from './DetailRightContent.vue';

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
  tabs?: TabItem[];
  defaultItemId?: string;
  defaultTabKey?: string;
  navigationLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  tabs: () => [],
  defaultItemId: undefined,
  defaultTabKey: undefined,
  navigationLabel: 'Select Item',
});

const selectedItemId = ref(props.defaultItemId || props.items[0]?.id || '');
const selectedTab = ref(props.defaultTabKey || '0');
const selectedItems = ref<string[]>([]);
const expandedGroups = ref<Record<string, boolean>>({});
const autostartEnabled = ref(true);
const sidebarOpen = ref(false);

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

const selectedItem = computed(() => {
  const topLevel = props.items.find((item) => item.id === selectedItemId.value);

  if (topLevel) return topLevel;

  for (const item of props.items) {
    if (item.children) {
      const nested = item.children.find((child) => child.id === selectedItemId.value);

      if (nested) return nested;
    }
  }
  return undefined;
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

const handleManageItemAction = (action: string) => {
  console.log('Manage item action:', action);
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};
</script>

<template>
  <div class="flex flex-col lg:flex-row h-full">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-20 lg:hidden"
      @click="closeSidebar"
    />

    <!-- Mobile navigation button -->
    <div class="lg:hidden m-4">
      <UButton color="primary" size="md" class="w-full justify-center" @click="toggleSidebar">
        {{ navigationLabel }}
      </UButton>
    </div>

    <!-- Navigation Sidebar -->
    <div
      :class="[
        'fixed lg:block lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        'w-72 lg:w-auto flex-shrink-0',
        'transform lg:transform-none transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'bg-white dark:bg-gray-900 lg:bg-transparent',
      ]"
    >
      <div class="h-full overflow-y-auto overflow-x-hidden p-4 lg:p-0">
        <!-- Close button for mobile -->
        <div class="lg:hidden flex justify-end mb-4">
          <UButton
            icon="i-lucide-x"
            size="sm"
            color="neutral"
            variant="ghost"
            square
            @click="closeSidebar"
          />
        </div>

        <DetailLeftNavigation
          :items="items"
          :selected-id="selectedItemId"
          :selected-items="selectedItems"
          :expanded-groups="expandedGroups"
          @update:selected-id="
            selectedItemId = $event;
            closeSidebar();
          "
          @update:selected-items="selectedItems = $event"
          @update:expanded-groups="expandedGroups = $event"
          @add="handleAddAction"
          @select-all="selectAllItems"
          @clear-all="clearAllSelections"
          @manage-action="handleManageSelectedAction"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 min-w-0 px-4 lg:px-0">
      <DetailRightContent
        :selected-item="selectedItem"
        :tabs="tabs"
        :selected-tab="selectedTab"
        @update:selected-tab="selectedTab = $event"
      >
        <template #header="{ item }">
          <DetailContentHeader :icon="item.icon" :title="item.label">
            <template #right-content>
              <template v-if="item.status && item.status.length > 0">
                <UBadge
                  v-for="(statusItem, index) in item.status"
                  :key="index"
                  variant="subtle"
                  color="neutral"
                  size="sm"
                >
                  <div :class="['h-2 w-2 rounded-full mr-2', statusItem.dotColor]" />
                  {{ statusItem.label }}
                </UBadge>
              </template>
            </template>
            <template #controls>
              <HeaderContent
                :autostart-value="autostartEnabled"
                @update:autostart="autostartEnabled = $event"
                @manage-action="handleManageItemAction"
              />
            </template>
          </DetailContentHeader>
        </template>
      </DetailRightContent>
    </div>
  </div>
</template>
