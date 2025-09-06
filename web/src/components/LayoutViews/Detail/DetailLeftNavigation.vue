<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Item } from '~/components/LayoutViews/Detail/Detail.vue';

interface Props {
  title?: string;
  items: Item[];
  selectedItems: string[];
  expandedGroups: Record<string, boolean>;
  showHeader?: boolean;
  manageActions?: Array<Array<{ label: string; icon: string; onClick?: () => void }>>;
  navigationLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Service Name',
  showHeader: true,
  manageActions: () => [
    [
      { label: 'Sort Alpha Asc', icon: 'i-lucide-arrow-up-a-z' },
      { label: 'Sort Alpha Dec', icon: 'i-lucide-arrow-down-z-a' },
    ],
    [
      { label: 'Start Selected', icon: 'i-lucide-play' },
      { label: 'Stop Selected', icon: 'i-lucide-square' },
      { label: 'Pause Selected', icon: 'i-lucide-pause' },
      { label: 'Restart Selected', icon: 'i-lucide-refresh-cw' },
      { label: 'Autostart Selected', icon: 'i-lucide-timer' },
    ],
    [
      { label: 'Check for Updates', icon: 'i-lucide-refresh-ccw' },
      { label: 'Update Selected', icon: 'i-lucide-download' },
      { label: 'Remove Selected', icon: 'i-lucide-trash-2' },
    ],
    [{ label: 'Add Container', icon: 'i-lucide-plus' }],
  ],
  navigationLabel: 'Select Item',
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

// Internal drawer state for mobile
const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

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
    sidebarOpen.value = false; // Close drawer on mobile when item is selected
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

const dropdownItems = computed(() =>
  props.manageActions.map((group) =>
    group.map((action) => ({
      label: action.label,
      icon: action.icon,
      onSelect: () => handleManageAction(action),
    }))
  )
);
</script>

<template>
  <div>
    <!-- Desktop navigation -->
    <div class="hidden lg:mr-16 lg:block">
      <div class="h-full overflow-x-hidden overflow-y-auto">
        <!-- Navigation Header -->
        <div v-if="showHeader" class="mb-6">
          <div class="mb-3 flex items-center justify-between">
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

          <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <UButton
              variant="link"
              color="primary"
              size="sm"
              :label="allItemsSelected ? 'Clear all' : 'Select all'"
              @click="allItemsSelected ? $emit('clearAll') : $emit('selectAll')"
            />

            <UDropdownMenu :items="dropdownItems" size="md">
              <UButton
                variant="subtle"
                color="primary"
                size="sm"
                trailing-icon="i-lucide-chevron-down"
                :disabled="selectedItemsCount === 0"
                class="w-full sm:w-auto"
              >
                <span class="sm:hidden">Manage ({{ selectedItemsCount }})</span>
                <span class="hidden sm:inline">Manage Selected ({{ selectedItemsCount }})</span>
              </UButton>
            </UDropdownMenu>
          </div>
        </div>

        <!-- Navigation Menu -->
        <UNavigationMenu :items="navigationMenuItems" orientation="vertical">
          <template v-for="item in allItemsWithSlots" :key="`slot-${item.id}`" #[item.slot!]>
            <div
              class="mb-2 flex min-w-0 items-center gap-3"
              @click="
                item.children && item.children.length > 0 ? toggleGroupExpansion(item.id) : undefined
              "
            >
              <UCheckbox
                :model-value="isItemSelected(item.id)"
                class="flex-shrink-0"
                @update:model-value="toggleItemSelection(item.id)"
                @click.stop
              />
              <UIcon v-if="item.icon" :name="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" class="flex-shrink-0" />

              <UIcon
                v-if="item.children?.length"
                name="i-lucide-chevron-down"
                :class="[
                  'h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200',
                  expandedGroups[item.id] ? 'rotate-180' : 'rotate-0',
                ]"
              />
            </div>
          </template>
        </UNavigationMenu>
      </div>
    </div>

    <!-- Mobile UDrawer -->
    <div class="lg:hidden">
      <div class="m-4">
        <UButton color="primary" size="md" class="w-full justify-center" @click="toggleSidebar">
          {{ navigationLabel }}
        </UButton>
      </div>

      <UDrawer v-model:open="sidebarOpen" direction="left" size="md">
        <template #content>
          <div class="h-full overflow-x-hidden overflow-y-auto p-4">
            <!-- Navigation Header -->
            <div v-if="showHeader" class="mb-6">
              <div class="mb-3 flex items-center justify-between">
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

              <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <UButton
                  variant="link"
                  color="primary"
                  size="sm"
                  :label="allItemsSelected ? 'Clear all' : 'Select all'"
                  @click="allItemsSelected ? $emit('clearAll') : $emit('selectAll')"
                />

                <UDropdownMenu :items="dropdownItems" size="md">
                  <UButton
                    variant="subtle"
                    color="primary"
                    size="sm"
                    trailing-icon="i-lucide-chevron-down"
                    :disabled="selectedItemsCount === 0"
                    class="w-full sm:w-auto"
                  >
                    <span class="sm:hidden">Manage ({{ selectedItemsCount }})</span>
                    <span class="hidden sm:inline">Manage Selected ({{ selectedItemsCount }})</span>
                  </UButton>
                </UDropdownMenu>
              </div>
            </div>

            <!-- Navigation Menu -->
            <UNavigationMenu :items="navigationMenuItems" orientation="vertical">
              <template v-for="item in allItemsWithSlots" :key="`slot-${item.id}`" #[item.slot!]>
                <div
                  class="mb-2 flex min-w-0 items-center gap-4"
                  @click="
                    item.children && item.children.length > 0 ? toggleGroupExpansion(item.id) : undefined
                  "
                >
                  <UCheckbox
                    :model-value="isItemSelected(item.id)"
                    class="flex-shrink-0"
                    @update:model-value="toggleItemSelection(item.id)"
                    @click.stop
                  />
                  <UIcon v-if="item.icon" :name="item.icon" class="h-5 w-5 flex-shrink-0" />
                  <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                  <UBadge
                    v-if="item.badge"
                    size="xs"
                    :label="String(item.badge)"
                    class="flex-shrink-0"
                  />

                  <UIcon
                    v-if="item.children?.length"
                    name="i-lucide-chevron-down"
                    :class="[
                      'h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200',
                      expandedGroups[item.id] ? 'rotate-180' : 'rotate-0',
                    ]"
                  />
                </div>
              </template>
            </UNavigationMenu>
          </div>
        </template>
      </UDrawer>
    </div>
  </div>
</template>
