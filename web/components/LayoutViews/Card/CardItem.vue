<script setup lang="ts">
import type { Item } from './Card.vue';

interface Props {
  item: Item;
  isSelected: boolean;
  isActive?: boolean;
  isGroupChild?: boolean;
  autostartValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autostartValue: false,
});

const emit = defineEmits<{
  toggleSelection: [itemId: string];
  click: [itemId: string];
  'update:autostart': [value: boolean];
}>();

const handleCardClick = () => {
  emit('click', props.item.id);
};

const handleCheckboxClick = (_value: boolean | 'indeterminate') => {
  emit('toggleSelection', props.item.id);
};
</script>

<template>
  <div :class="isGroupChild ? 'ml-4' : ''">
    <UCard
      :class="[
        'w-full cursor-pointer transition-all duration-200 hover:shadow-md group',
        isActive ? 'ring-2 ring-primary-500' : '',
      ]"
      @click="handleCardClick"
    >
      <div class="flex items-center gap-4 py-2">
        <!-- Selection Checkbox -->
        <div class="flex-shrink-0 pl-2">
          <UCheckbox :model-value="isSelected" @update:model-value="handleCheckboxClick" @click.stop />
        </div>

        <!-- Icon -->
        <div class="flex-shrink-0">
          <UIcon v-if="item.icon" :name="item.icon" class="h-8 w-8" />
          <div v-else class="h-8 w-8 rounded flex items-center justify-center">
            <UIcon name="i-lucide-box" class="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold truncate">
              {{ item.label }}
            </h3>
            <UBadge v-if="item.badge" size="xs" :label="String(item.badge)" />
            <div v-if="item.status && item.status.length > 0" class="flex flex-wrap gap-2 ml-4">
              <UBadge
                v-for="(statusItem, index) in item.status"
                :key="index"
                variant="subtle"
                color="neutral"
                size="sm"
                class="flex items-center"
              >
                <div :class="['h-2 w-2 rounded-full mr-2', statusItem.dotColor]" />
                {{ statusItem.label }}
              </UBadge>
              <div class="text-sm ml-4">Uptime: 10 hours</div>
            </div>
          </div>
        </div>

        <!-- Right side content -->
        <div class="flex items-center gap-4 flex-shrink-0 pr-2">
          <!-- Action Buttons - only visible on hover -->
          <div class="hidden group-hover:flex items-center gap-2">
            <UButton color="primary" variant="outline" size="sm" @click.stop> Manage </UButton>
            <UButton color="primary" variant="solid" size="sm" @click.stop> Visit </UButton>
          </div>

          <!-- Autostart Toggle - only visible on hover -->
          <div class="hidden group-hover:flex items-center gap-2">
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
