<script setup lang="ts">
import { computed } from 'vue';

import type { Item, TabItem } from './Detail.vue';

interface Props {
  selectedItem?: Item;
  tabs: TabItem[];
  selectedTab: string;
  showHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: undefined,
  showHeader: true,
});

const emit = defineEmits<{
  'update:selectedTab': [value: string];
}>();

const tabItems = computed(() =>
  props.tabs.map((tab) => ({
    label: tab.label,
    key: tab.key,
    disabled: tab.disabled,
  }))
);

const getCurrentTabComponent = () => {
  const tabIndex = parseInt(props.selectedTab);

  // Validate that tabIndex is a valid number and within bounds
  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= props.tabs.length) {
    return null;
  }

  return props.tabs[tabIndex]?.component || null;
};

const getCurrentTabProps = () => {
  const tabIndex = parseInt(props.selectedTab);

  // Validate that tabIndex is a valid number and within bounds
  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= props.tabs.length) {
    return {
      item: props.selectedItem,
    };
  }

  const currentTab = props.tabs[tabIndex];

  return {
    item: props.selectedItem,
    ...currentTab?.props,
  };
};

const updateSelectedTab = (value: string | number) => {
  emit('update:selectedTab', String(value));
};
</script>

<template>
  <div class="flex-1 min-w-0 px-4 lg:px-0">
    <div v-if="showHeader && selectedItem" class="mb-6">
      <slot name="header" :item="selectedItem" />
    </div>

    <div class="overflow-x-auto -mx-4 px-4">
      <UTabs
        :model-value="selectedTab"
        variant="link"
        :items="tabItems"
        class="w-full"
        :ui="{
          list: 'gap-3 sm:gap-6 md:gap-8 whitespace-nowrap text-sm sm:text-base',
        }"
        @update:model-value="updateSelectedTab"
      />
    </div>

    <div class="mt-4 sm:mt-6">
      <component
        :is="getCurrentTabComponent()"
        v-if="getCurrentTabComponent() && selectedItem"
        v-bind="getCurrentTabProps()"
      />
      <div v-else-if="!selectedItem">
        <slot name="empty">No item selected</slot>
      </div>
      <div v-else>
        <slot name="no-content">No content available</slot>
      </div>
    </div>
  </div>
</template>
