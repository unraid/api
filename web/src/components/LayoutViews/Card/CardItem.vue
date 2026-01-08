<script setup lang="ts">
import type { Item } from '~/components/LayoutViews/Card/Card.vue';

interface Props {
  item: Item;
  isSelected: boolean;
  isActive?: boolean;
  isGroupChild?: boolean;
  autostartValue?: boolean;
  isRunning?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autostartValue: false,
  isRunning: false,
});

const emit = defineEmits<{
  toggleSelection: [itemId: string];
  click: [itemId: string];
  'update:autostart': [value: boolean];
  toggleRunning: [itemId: string];
}>();

const handleCardClick = () => {
  emit('click', props.item.id);
};

const handleCheckboxClick = (_value: boolean | 'indeterminate') => {
  emit('toggleSelection', props.item.id);
};

const handleToggleRunning = () => {
  // TODO: Wire up to actual start/stop functionality for docker containers and VMs
  console.log('Toggle running state for:', props.item.id, 'Current state:', props.isRunning);
  emit('toggleRunning', props.item.id);
};
</script>

<template>
  <div :class="isGroupChild ? 'ml-4' : ''">
    <UCard
      :class="[
        'group w-full cursor-pointer transition-all duration-200 hover:shadow-md',
        isActive ? 'ring-primary-500 ring-2' : '',
      ]"
      @click="handleCardClick"
    >
      <div class="flex items-center gap-4 py-2">
        <!-- Selection Checkbox -->
        <div class="flex flex-shrink-0 items-center pl-2">
          <UCheckbox :model-value="isSelected" @update:model-value="handleCheckboxClick" @click.stop />
        </div>

        <!-- Icon -->
        <div class="flex flex-shrink-0 items-center">
          <UIcon v-if="item.icon" :name="item.icon" class="h-8 w-8" />
          <div v-else class="flex h-8 w-8 items-center justify-center rounded">
            <UIcon name="i-lucide-box" class="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <!-- Play/Stop Button -->
        <div class="flex flex-shrink-0 items-center">
          <button
            class="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            :aria-label="isRunning ? 'Stop' : 'Start'"
            @click.stop="handleToggleRunning"
          >
            <svg
              v-if="!isRunning"
              class="h-4 w-4 fill-green-500 hover:fill-green-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg
              v-else
              class="h-4 w-4 fill-red-500 hover:fill-red-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex min-w-0 flex-1 items-center">
          <div class="flex w-full items-center gap-2">
            <h3 class="truncate font-semibold">
              {{ item.label }}
            </h3>
            <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" />
            <div v-if="item.status && item.status.length > 0" class="ml-4 flex flex-wrap gap-2">
              <UBadge
                v-for="(statusItem, index) in item.status"
                :key="index"
                variant="subtle"
                color="neutral"
                size="sm"
                class="flex items-center"
              >
                <div :class="['mr-2 h-2 w-2 rounded-full', statusItem.dotColor]" />
                {{ statusItem.label }}
              </UBadge>
              <div class="ml-4 text-sm">Uptime: 10 hours</div>
            </div>
          </div>
        </div>

        <!-- Right side content -->
        <div class="flex flex-shrink-0 items-center gap-4 pr-2">
          <!-- Action Buttons - only visible on hover -->
          <div class="hidden items-center gap-2 group-hover:flex">
            <UButton color="primary" variant="outline" size="sm" @click.stop> Manage </UButton>
            <UButton color="primary" variant="solid" size="sm" @click.stop> WebUI </UButton>
          </div>

          <!-- Autostart Toggle - only visible on hover -->
          <div class="hidden items-center gap-2 group-hover:flex">
            <span class="text-sm font-medium">Autostart</span>
            <USwitch
              :model-value="autostartValue"
              @update:model-value="$emit('update:autostart', $event)"
              @click.stop
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
