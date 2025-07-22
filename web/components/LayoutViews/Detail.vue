<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { UIcon, UBadge, UTabs } from '#components';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
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

const selectedNavigationItem = computed(() =>
  props.navigationItems.find((item) => item.id === selectedNavigationId.value)
);

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
      <nav class="space-y-1">
        <button
          v-for="item in navigationItems"
          :key="item.id"
          :class="[
            'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            selectedNavigationId === item.id
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
          ]"
          @click="selectNavigationItem(item.id)"
        >
          <UIcon v-if="item.icon" :name="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span class="truncate">{{ item.label }}</span>
          <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" class="ml-auto" />
        </button>
      </nav>
    </div>

    <!-- Right Content Section -->
    <div class="flex-1 min-w-0">
      <UTabs v-model="selectedTab" :items="tabItems" class="w-full" />

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
