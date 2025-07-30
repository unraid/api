<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { UBadge } from '#components';

import type { Component } from 'vue';

import HeaderContent from '../../Docker/HeaderContent.vue';
import DetailContentHeader from './DetailContentHeader.vue';
import DetailLeftNavigation from './DetailLeftNavigation.vue';
import DetailRightContent from './DetailRightContent.vue';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  slot?: string;
  status?: {
    label: string;
    dotColor: string;
  }[];
  children?: NavigationItem[];
  isGroup?: boolean;
}

interface TabItem {
  key: string;
  label: string;
  component?: Component;
  props?: Record<string, unknown>;
  disabled?: boolean;
}

interface Props {
  navigationItems?: NavigationItem[];
  tabs?: TabItem[];
  defaultNavigationId?: string;
  defaultTabKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  navigationItems: () => [],
  tabs: () => [],
  defaultNavigationId: undefined,
  defaultTabKey: undefined,
});

const selectedNavigationId = ref(props.defaultNavigationId || props.navigationItems[0]?.id || '');
const selectedTab = ref(props.defaultTabKey || '0');
const selectedItems = ref<string[]>([]);
const expandedGroups = ref<Record<string, boolean>>({});
const autostartEnabled = ref(true);

// Initialize expanded state for groups
const initializeExpandedState = () => {
  props.navigationItems.forEach((item) => {
    if (item.isGroup) {
      expandedGroups.value[item.id] = true;
    }
  });
};

initializeExpandedState();

watch(
  () => props.navigationItems,
  () => {
    initializeExpandedState();
  },
  { deep: true }
);

const selectedNavigationItem = computed(() => {
  const topLevel = props.navigationItems.find((item) => item.id === selectedNavigationId.value);

  if (topLevel) return topLevel;

  for (const item of props.navigationItems) {
    if (item.children) {
      const nested = item.children.find((child) => child.id === selectedNavigationId.value);

      if (nested) return nested;
    }
  }
  return undefined;
});

// Reusable function to collect all selectable items
const collectSelectableItems = (items: NavigationItem[]): string[] => {
  const selectableItems: string[] = [];

  const collect = (items: NavigationItem[]) => {
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
  selectedItems.value = [...collectSelectableItems(props.navigationItems)];
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
  <div class="flex h-full gap-6">
    <DetailLeftNavigation
      :navigation-items="navigationItems"
      :selected-id="selectedNavigationId"
      :selected-items="selectedItems"
      :expanded-groups="expandedGroups"
      @update:selected-id="selectedNavigationId = $event"
      @update:selected-items="selectedItems = $event"
      @update:expanded-groups="expandedGroups = $event"
      @add="handleAddAction"
      @select-all="selectAllItems"
      @clear-all="clearAllSelections"
      @manage-action="handleManageSelectedAction"
    />

    <DetailRightContent
      :selected-item="selectedNavigationItem"
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
</template>
