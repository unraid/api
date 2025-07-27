<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Component } from 'vue';

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

const expandedGroups = ref<Record<string, boolean>>({});

// Initialize expanded state for groups (defaultOpen = true)
const initializeExpandedState = () => {
  props.navigationItems.forEach((item) => {
    if (item.isGroup) {
      expandedGroups.value[item.id] = true; // Start expanded
      console.log(`Initialized group ${item.id} as expanded:`, true);
    }
  });
  console.log('Initial expandedGroups state:', expandedGroups.value);
};

initializeExpandedState();

// Watch for changes in navigation items to reinitialize expanded state
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

const navigationMenuItems = computed((): NavigationMenuItem[] =>
  props.navigationItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    id: item.id,
    badge: String(item.badge || ''),
    slot: item.slot,
    // Only add onClick for non-group items
    ...(item.isGroup ? {} : { onClick: () => selectNavigationItem(item.id) }),
    isGroup: item.isGroup,
    status: item.status,
    // Only add 'to' for non-group items to preserve chevron arrow for groups
    ...(item.isGroup ? {} : { to: '#' }),
    defaultOpen: item.isGroup ? true : undefined,
    children: item.children?.map((child) => ({
      label: child.label,
      icon: child.icon,
      id: child.id,
      badge: String(child.badge || ''),
      slot: child.slot,
      onClick: () => selectNavigationItem(child.id),
      status: child.status,
      to: '#',
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
  // Don't select group items - they should only toggle expansion
  const actualItem =
    props.navigationItems.find((item) => item.id === id) ||
    props.navigationItems.flatMap((item) => item.children || []).find((child) => child.id === id);

  if (actualItem && !actualItem.isGroup) {
    selectedNavigationId.value = id;
    selectedTab.value = '0'; // Reset to first tab index
  }
};

const toggleGroupExpansion = (groupId: string) => {
  expandedGroups.value[groupId] = !expandedGroups.value[groupId];
  console.log(`Manually toggled group ${groupId} to:`, expandedGroups.value[groupId]);
};

// Select all functionality
const selectAllItems = () => {
  const allSelectableItems: string[] = [];

  const collectSelectableItems = (items: NavigationItem[]) => {
    for (const item of items) {
      if (!item.isGroup) {
        allSelectableItems.push(item.id);
      }

      if (item.children) {
        collectSelectableItems(item.children);
      }
    }
  };

  collectSelectableItems(props.navigationItems);
  selectedItems.value = [...allSelectableItems];
};

const clearAllSelections = () => {
  selectedItems.value = [];
};

const allItemsSelected = computed(() => {
  const allSelectableItems: string[] = [];

  const collectSelectableItems = (items: NavigationItem[]) => {
    for (const item of items) {
      if (!item.isGroup) {
        allSelectableItems.push(item.id);
      }

      if (item.children) {
        collectSelectableItems(item.children);
      }
    }
  };

  collectSelectableItems(props.navigationItems);
  return (
    allSelectableItems.length > 0 && allSelectableItems.every((id) => selectedItems.value.includes(id))
  );
});

const selectedItemsCount = computed(() => selectedItems.value.length);

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
    <div class="mr-8 w-64 flex-shrink-0">
      <!-- Header Section -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Service Name</h2>
          <UButton icon="i-lucide-plus" size="sm" color="primary" variant="ghost" square />
        </div>

        <div class="flex items-center justify-between">
          <UButton
            variant="link"
            color="primary"
            size="sm"
            :label="allItemsSelected ? 'Clear all' : 'Select all'"
            @click="allItemsSelected ? clearAllSelections() : selectAllItems()"
          />

          <UDropdownMenu
            :items="[
              [{ label: 'Start', icon: 'i-lucide-play' }],
              [{ label: 'Stop', icon: 'i-lucide-square' }],
              [{ label: 'Restart', icon: 'i-lucide-refresh-cw' }],
              [{ label: 'Remove', icon: 'i-lucide-trash-2' }],
            ]"
          >
            <UButton
              variant="subtle"
              color="primary"
              size="sm"
              trailing-icon="i-lucide-chevron-down"
              :disabled="selectedItemsCount === 0"
            >
              Manage Selected ({{ selectedItemsCount }})
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
      <UNavigationMenu :items="navigationMenuItems" orientation="vertical">
        <!-- Dynamic nav item slots -->
        <template v-for="item in allItemsWithSlots" :key="`slot-${item.id}`" #[item.slot!]>
          <div
            class="flex items-center gap-3 mb-2"
            @click="
              item.children && item.children.length > 0 ? toggleGroupExpansion(item.id) : undefined
            "
          >
            <UCheckbox
              :model-value="isItemSelected(item.id)"
              @update:model-value="toggleItemSelection(item.id)"
              @click.stop
            />
            <UIcon v-if="item.icon" :name="item.icon" class="h-5 w-5" />
            <span class="truncate flex-1">{{ item.label }}</span>
            <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" />

            <UIcon
              v-if="item.children?.length"
              name="i-lucide-chevron-down"
              :class="[
                'h-5 w-5 text-gray-400 transition-transform duration-200',
                expandedGroups[item.id] ? 'rotate-180' : 'rotate-0',
              ]"
            />
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
          <h1 class="text-2xl mr-2 font-semibold text-gray-900 dark:text-white">
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
              <div :class="['h-2 w-2 rounded-full mr-2', statusItem.dotColor]" />
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
            <UButton variant="subtle" color="primary" size="sm" trailing-icon="i-lucide-chevron-down">
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
