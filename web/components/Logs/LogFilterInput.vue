<script setup lang="ts">
import { computed } from 'vue';
import { Input, Label, Select } from '@unraid/ui';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

interface PresetFilter {
  value: string;
  label: string;
}

const props = withDefaults(defineProps<{
  modelValue: string;
  preset?: string;
  showPresets?: boolean;
  presetFilters?: PresetFilter[];
  inputClass?: string;
  placeholder?: string;
  label?: string;
  showIcon?: boolean;
}>(), {
  showPresets: false,
  presetFilters: () => [
    { value: 'none', label: 'No Filter' },
    { value: 'OIDC', label: 'OIDC Logs' },
    { value: 'ERROR', label: 'Errors' },
    { value: 'WARNING', label: 'Warnings' },
    { value: 'AUTH', label: 'Authentication' },
  ],
  placeholder: 'Filter logs...',
  label: 'Filter',
  showIcon: true,
  inputClass: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:preset': [value: string];
}>();

const filterText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const presetValue = computed({
  get: () => props.preset || 'none',
  set: (value) => {
    emit('update:preset', value);
    if (value && value !== 'none') {
      emit('update:modelValue', value);
    } else if (value === 'none') {
      emit('update:modelValue', '');
    }
  }
});
</script>

<template>
  <div class="flex gap-2 items-end">
    <div v-if="showPresets" class="min-w-[150px]">
      <Label v-if="label" :for="`preset-filter-${$.uid}`">Quick {{ label }}</Label>
      <Select
        :id="`preset-filter-${$.uid}`"
        v-model="presetValue"
        :items="presetFilters"
        placeholder="Select filter"
        class="w-full"
      />
    </div>
    
    <div class="relative flex-1">
      <Label v-if="label && !showPresets" :for="`filter-input-${$.uid}`">{{ label }}</Label>
      <Label v-else-if="label && showPresets" :for="`filter-input-${$.uid}`">Custom {{ label }}</Label>
      <div class="relative">
        <MagnifyingGlassIcon 
          v-if="showIcon"
          class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
        />
        <Input
          :id="`filter-input-${$.uid}`"
          v-model="filterText"
          type="text"
          :placeholder="placeholder"
          :class="[showIcon ? 'pl-8' : '', inputClass]"
        />
      </div>
    </div>
  </div>
</template>
