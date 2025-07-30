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
  return props.tabs[tabIndex]?.component;
};

const getCurrentTabProps = () => {
  const tabIndex = parseInt(props.selectedTab);
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
  <div class="flex-1 min-w-0">
    <div v-if="showHeader && selectedItem" class="mb-6">
      <slot name="header" :item="selectedItem" />
    </div>

    <UTabs
      :model-value="selectedTab"
      variant="link"
      :items="tabItems"
      class="w-full"
      @update:model-value="updateSelectedTab"
    />

    <div class="mt-6">
      <component
        :is="getCurrentTabComponent()"
        v-if="getCurrentTabComponent() && selectedItem"
        v-bind="getCurrentTabProps()"
      />
      <div v-else-if="!selectedItem" class="text-gray-500 dark:text-gray-400">
        <slot name="empty">No item selected</slot>
      </div>
      <div v-else class="text-gray-500 dark:text-gray-400">
        <slot name="no-content">No content available</slot>
      </div>
    </div>
  </div>
</template>
