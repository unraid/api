<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@unraid/ui';
import type { SelectItemType } from '@unraid/ui';
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline';
import LogFilterInput from './LogFilterInput.vue';

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  filterText: string;
  showToggle?: boolean;
  isExpanded?: boolean;
  showRefresh?: boolean;
  showPresets?: boolean;
  presetFilter?: string;
  presetFilters?: SelectItemType[];
  filterPlaceholder?: string;
  filterLabel?: string;
  compact?: boolean;
}>(), {
  title: '',
  description: '',
  showToggle: false,
  isExpanded: true,
  showRefresh: true,
  showPresets: false,
  presetFilter: 'none',
  presetFilters: () => [],
  filterPlaceholder: 'Filter logs...',
  filterLabel: 'Filter',
  compact: false
});

const emit = defineEmits<{
  'update:filterText': [value: string];
  'update:presetFilter': [value: string];
  'update:isExpanded': [value: boolean];
  'refresh': [];
}>();

const filterValue = computed({
  get: () => props.filterText,
  set: (value) => emit('update:filterText', value)
});

const presetValue = computed({
  get: () => props.presetFilter || 'none',
  set: (value) => emit('update:presetFilter', value)
});

const toggleExpanded = () => {
  emit('update:isExpanded', !props.isExpanded);
};

const handleRefresh = () => {
  emit('refresh');
};
</script>

<template>
  <div :class="['border-b', compact ? 'p-3' : 'p-4 pb-3', 'border-muted']">
    <div class="flex justify-between items-center">
      <div v-if="title || description">
        <h3 v-if="title" :class="[compact ? 'text-sm' : 'text-base', 'font-semibold']">{{ title }}</h3>
        <p v-if="description" :class="['mt-1 text-muted-foreground', compact ? 'text-xs' : 'text-sm']">
          {{ description }}
        </p>
      </div>
      
      <div class="flex gap-2 items-center" :class="!title && !description ? 'w-full' : ''">
        <div :class="!title && !description ? 'flex-1' : ''">
          <LogFilterInput
            v-model="filterValue"
            v-model:preset="presetValue"
            :show-presets="showPresets"
            :preset-filters="presetFilters"
            :placeholder="filterPlaceholder"
            :label="compact || (!title && !description) ? filterLabel : ''"
            :input-class="compact ? 'h-7 text-sm' : 'h-8'"
          />
        </div>
        
        <Button
          v-if="showRefresh"
          variant="outline"
          :size="compact ? 'sm' : 'sm'"
          title="Refresh logs"
          @click="handleRefresh"
        >
          <ArrowPathIcon :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
        </Button>
        
        <Button
          v-if="showToggle"
          variant="outline"
          :size="compact ? 'sm' : 'sm'"
          @click="toggleExpanded"
        >
          <component 
            :is="isExpanded ? EyeSlashIcon : EyeIcon" 
            :class="compact ? 'h-3 w-3' : 'h-4 w-4'" 
          />
          <span v-if="!compact" class="ml-2">{{ isExpanded ? 'Hide' : 'Show' }} Logs</span>
        </Button>
        
        <Button
          v-else-if="showToggle === false && typeof isExpanded === 'boolean'"
          variant="ghost"
          :size="compact ? 'sm' : 'sm'"
          class="p-1"
          @click="toggleExpanded"
        >
          <component 
            :is="isExpanded ? ChevronUpIcon : ChevronDownIcon" 
            :class="compact ? 'h-3 w-3' : 'h-4 w-4'" 
          />
        </Button>
      </div>
    </div>
  </div>
</template>
