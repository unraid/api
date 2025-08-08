<script setup lang="ts">
import { computed } from 'vue';

import type { Item } from './Card.vue';

import CardGroupHeader from './CardGroupHeader.vue';
import CardItem from './CardItem.vue';

interface Props {
  items: Item[];
  selectedItems: string[];
  selectedItemId?: string;
  expandedGroups: Record<string, boolean>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectedItems': [items: string[]];
  'item-select': [itemId: string];
  'update:expandedGroups': [groups: Record<string, boolean>];
}>();

const flattenedItems = computed(() => {
  const result: Array<Item & { isGroupChild?: boolean; parentGroup?: string }> = [];

  for (const item of props.items) {
    if (item.isGroup && item.children) {
      // Add group header
      result.push(item);
      // Add children only if group is expanded
      if (props.expandedGroups[item.id]) {
        for (const child of item.children) {
          result.push({
            ...child,
            isGroupChild: true,
            parentGroup: item.id,
          });
        }
      }
    } else {
      result.push(item);
    }
  }

  return result;
});

const toggleItemSelection = (itemId: string) => {
  const newItems = [...props.selectedItems];
  const index = newItems.indexOf(itemId);

  if (index > -1) {
    newItems.splice(index, 1);
  } else {
    newItems.push(itemId);
  }

  emit('update:selectedItems', newItems);
};

const isItemSelected = (itemId: string) => {
  return props.selectedItems.includes(itemId);
};

const handleItemClick = (itemId: string) => {
  emit('item-select', itemId);
};

const toggleGroupExpansion = (groupId: string) => {
  const newGroups = { ...props.expandedGroups };
  newGroups[groupId] = !newGroups[groupId];
  emit('update:expandedGroups', newGroups);
};
</script>

<template>
  <div class="p-6 w-full">
    <div class="space-y-4 w-full max-w-full">
      <template v-for="item in flattenedItems" :key="item.id">
        <!-- Group Header -->
        <CardGroupHeader
          v-if="item.isGroup"
          :label="item.label"
          :icon="item.icon"
          :badge="item.badge"
          :is-expanded="expandedGroups[item.id]"
          @toggle="toggleGroupExpansion(item.id)"
        />

        <!-- Regular Card Item -->
        <CardItem
          v-else
          :item="item"
          :is-selected="isItemSelected(item.id)"
          :is-active="selectedItemId === item.id"
          :is-group-child="item.isGroupChild"
          @toggle-selection="toggleItemSelection"
          @click="handleItemClick"
        />
      </template>
    </div>
  </div>
</template>
