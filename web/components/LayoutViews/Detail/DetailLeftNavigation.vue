<script setup lang="ts">
import { computed } from 'vue';
import type { Item } from './Detail.vue';

interface Props {
  title?: string;
  items: Item[];
  selectedId: string;
  selectedItems: string[];
  expandedGroups: Record<string, boolean>;
  showHeader?: boolean;
  manageActions?: Array<{ label: string; icon: string; onClick?: () => void }>;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Service Name',
  showHeader: true,
  manageActions: () => [
    { label: 'Start', icon: 'i-lucide-play' },
    { label: 'Stop', icon: 'i-lucide-square' },
    { label: 'Restart', icon: 'i-lucide-refresh-cw' },
    { label: 'Remove', icon: 'i-lucide-trash-2' },
  ],
});

const emit = defineEmits<{
  'update:selectedId': [id: string];
  'update:selectedItems': [items: string[]];
  'update:expandedGroups': [groups: Record<string, boolean>];
  add: [];
  selectAll: [];
  clearAll: [];
  manageAction: [action: string];
}>();

const navigationMenuItems = computed(() =>
  props.items.map((item) => ({
    label: item.label,
    icon: item.icon,
    id: item.id,
    badge: String(item.badge || ''),
    slot: item.slot,
    ...(item.isGroup ? {} : { onClick: () => selectNavigationItem(item.id) }),
    isGroup: item.isGroup,
    status: item.status,
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

interface NavigationMenuItem {
  id: string;
  label: string;
  icon?: string;
  badge: string;
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

const allItemsSelected = computed(() => {
  const allSelectableItems: string[] = [];
  const collectSelectableItems = (items: Item[]) => {
    for (const item of items) {
      if (!item.isGroup) {
        allSelectableItems.push(item.id);
      }
      if (item.children) {
        collectSelectableItems(item.children);
      }
    }
  };
  collectSelectableItems(props.items);
  return (
    allSelectableItems.length > 0 && allSelectableItems.every((id) => props.selectedItems.includes(id))
  );
});

const selectedItemsCount = computed(() => props.selectedItems.length);

const selectNavigationItem = (id: string) => {
  const actualItem =
    props.items.find((item) => item.id === id) ||
    props.items.flatMap((item) => item.children || []).find((child) => child.id === id);

  if (actualItem && !actualItem.isGroup) {
    emit('update:selectedId', id);
  }
};

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

const toggleGroupExpansion = (groupId: string) => {
  const newGroups = { ...props.expandedGroups };
  newGroups[groupId] = !newGroups[groupId];
  emit('update:expandedGroups', newGroups);
};

const handleManageAction = (action: { label: string; icon: string }) => {
  emit('manageAction', action.label);
};

const dropdownItems = computed(() => [
  props.manageActions.map(action => ({
    label: action.label,
    icon: action.icon,
    onSelect: () => handleManageAction(action)
  }))
]);
</script>

<template>
  <div class="mr-8 w-64 flex-shrink-0">
    <div v-if="showHeader" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="primary"
          variant="ghost"
          square
          @click="$emit('add')"
        />
      </div>

      <div class="flex items-center justify-between">
        <UButton
          variant="link"
          color="primary"
          size="sm"
          :label="allItemsSelected ? 'Clear all' : 'Select all'"
          @click="allItemsSelected ? $emit('clearAll') : $emit('selectAll')"
        />

        <UDropdownMenu :items="dropdownItems">
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
      <template v-for="item in allItemsWithSlots" :key="`slot-${item.id}`" #[item.slot!]>
        <div
          class="flex items-center gap-3 mb-2"
          @click="item.children && item.children.length > 0 ? toggleGroupExpansion(item.id) : undefined"
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
</template>
