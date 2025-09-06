<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import HeaderContent from '@/components/Docker/HeaderContent.vue';

import type { Component } from 'vue';

import DetailContentHeader from '~/components/LayoutViews/Detail/DetailContentHeader.vue';
import DetailLeftNavigation from '~/components/LayoutViews/Detail/DetailLeftNavigation.vue';
import DetailRightContent from '~/components/LayoutViews/Detail/DetailRightContent.vue';

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
</script>

<template>
  <div class="flex h-full flex-col p-4 lg:flex-row">
    <!-- Navigation -->
    <DetailLeftNavigation
      :items="items"
      :selected-id="selectedItemId"
      :selected-items="selectedItems"
      :expanded-groups="expandedGroups"
      :navigation-label="navigationLabel"
      @update:selected-id="selectedItemId = $event"
      @update:selected-items="selectedItems = $event"
      @update:expanded-groups="expandedGroups = $event"
      @add="handleAddAction"
      @select-all="selectAllItems"
      @clear-all="clearAllSelections"
      @manage-action="handleManageSelectedAction"
    />

    <!-- Main Content -->
    <div class="min-w-0 flex-1">
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
                  <div :class="['mr-2 h-2 w-2 rounded-full', statusItem.dotColor]" />
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
