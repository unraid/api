<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  UBadge,
  UButton,
  UCheckbox,
  UDropdownMenu,
  UIcon,
  UNavigationMenu,
  USwitch,
  UTabs,
} from '#components';

import type { Component } from 'vue';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  slot?: string;
  status?: {
    label: string;
    dotColor: string; // Tailwind color class like 'bg-green-500'
  }[];
  children?: NavigationItem[]; // For grouped/nested items
  isGroup?: boolean; // Indicates if this is a group/folder
}

interface NavigationMenuItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  slot?: string;
  onClick?: () => void;
  isGroup?: boolean;
  status?: {
    label: string;
    dotColor: string;
  }[];
  children?: NavigationMenuItem[];
  to?: string;
  defaultOpen?: boolean;
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

const selectedNavigationItem = computed(() => {
  // First check top-level items
  const topLevel = props.navigationItems.find((item) => item.id === selectedNavigationId.value);
  if (topLevel) return topLevel;

  // Then check nested items
  for (const item of props.navigationItems) {
    if (item.children) {
      const nested = item.children.find((child) => child.id === selectedNavigationId.value);
      if (nested) return nested;
    }
  }

  return undefined;
});

const navigationMenuItems = computed((): NavigationMenuItem[] =>
  props.navigationItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    id: item.id,
    badge: String(item.badge || ''),
    slot: item.slot,
    onClick: () => selectNavigationItem(item.id),
    isGroup: item.isGroup,
    status: item.status,
    // For groups, don't add 'to' property to enable accordion behavior
    to: item.isGroup ? undefined : '#',
    // Add defaultOpen for groups to control initial state
    defaultOpen: item.isGroup ? true : undefined,
    children: item.children?.map((child) => ({
      label: child.label,
      icon: child.icon,
      id: child.id,
      badge: String(child.badge || ''),
      slot: child.slot,
      onClick: () => selectNavigationItem(child.id),
      status: child.status,
      to: '#', // Add 'to' property for children to make them clickable
    })),
  }))
);

const toggleItemSelection = (itemId: string) => {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
};

const isItemSelected = (itemId: string) => {
  return selectedItems.value.includes(itemId);
};

const tabItems = computed(() =>
  props.tabs.map((tab) => ({
    label: tab.label,
    key: tab.key,
    disabled: tab.disabled,
  }))
);

const selectNavigationItem = (id: string) => {
  selectedNavigationId.value = id;
  selectedTab.value = '0'; // Reset to first tab index
};

// Helper to get all items with slots (including nested children)
const allItemsWithSlots = computed(() => {
  const items: NavigationMenuItem[] = [];
  
  const collectItems = (navItems: NavigationMenuItem[]) => {
    for (const item of navItems) {
      if (item.slot) {
        items.push(item);
      }
      if (item.children) {
        collectItems(item.children);
      }
    }
  };
  
  collectItems(navigationMenuItems.value);
  return items;
});

// UTabs uses index, so convert to tab key
const getCurrentTabComponent = () => {
  const tabIndex = parseInt(selectedTab.value);

  return props.tabs[tabIndex]?.component;
};

const getCurrentTabProps = () => {
  const tabIndex = parseInt(selectedTab.value);
  const currentTab = props.tabs[tabIndex];

  return {
    item: selectedNavigationItem.value,
    ...currentTab?.props,
  };
};
</script>

<template>
  <div class="flex h-full gap-6">
    <!-- Left Navigation Section -->
    <div class="w-64 flex-shrink-0">
      <UNavigationMenu :items="navigationMenuItems" orientation="vertical">
        <!-- Dynamic slots for all items with custom content -->
        <template 
          v-for="item in allItemsWithSlots" 
          :key="`slot-${item.id}`"
          #[item.slot!]
        >
          <div class="flex items-center gap-3">
            <UCheckbox
              :model-value="isItemSelected(item.id)"
              class="flex-shrink-0"
              @update:model-value="toggleItemSelection(item.id)"
              @click.stop
            />
            <UIcon v-if="item.icon" :name="item.icon" class="h-5 w-5 flex-shrink-0" />
            <span class="truncate flex-1">{{ item.label }}</span>
            <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" />
          </div>
        </template>
      </UNavigationMenu>
    </div>

    <!-- Right Content Section -->
    <div class="flex-1 min-w-0">
      <div v-if="selectedNavigationItem" class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon
            v-if="selectedNavigationItem.icon"
            :name="selectedNavigationItem.icon"
            class="h-8 w-8"
          />
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ selectedNavigationItem.label }}
          </h1>

          <!-- Status Indicators -->
          <div v-if="selectedNavigationItem.status" class="flex items-center gap-4">
            <UBadge
              v-for="(statusItem, index) in selectedNavigationItem.status"
              :key="index"
              variant="subtle"
              color="neutral"
              size="sm"
            >
              <div :class="['h-2 w-2 rounded-full mr-2', statusItem.dotColor]"/>
              {{ statusItem.label }}
            </UBadge>
          </div>
        </div>

        <!-- Right Side Controls -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium">Autostart</span>
            <USwitch :model-value="true" />
          </div>

          <!-- Manage Dropdown -->
          <UDropdownMenu
            :items="[
              [{ label: 'Edit', icon: 'i-lucide-edit' }],
              [{ label: 'Remove', icon: 'i-lucide-trash-2' }],
              [{ label: 'Restart', icon: 'i-lucide-refresh-cw' }],
              [{ label: 'Force Update', icon: 'i-lucide-download' }],
            ]"
          >
            <UButton variant="outline" color="primary" trailing-icon="i-lucide-chevron-down">
              Manage
            </UButton>
          </UDropdownMenu>
        </div>
      </div>

      <UTabs v-model="selectedTab" variant="link" :items="tabItems" class="w-full" />

      <!-- Tab Content -->
      <div class="mt-6">
        <component
          :is="getCurrentTabComponent()"
          v-if="getCurrentTabComponent() && selectedNavigationItem"
          v-bind="getCurrentTabProps()"
        />
        <div v-else-if="!selectedNavigationItem" class="text-gray-500 dark:text-gray-400">
          No item selected
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400">No content available</div>
      </div>
    </div>
  </div>
</template>
