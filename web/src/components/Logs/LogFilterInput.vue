<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { Input, Label, Select } from '@unraid/ui';

import type { SelectItemType } from '@unraid/ui';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    preset?: string;
    showPresets?: boolean;
    presetFilters?: SelectItemType[];
    inputClass?: string;
    placeholder?: string;
    label?: string;
    showIcon?: boolean;
  }>(),
  {
    preset: 'none',
    showPresets: false,
    presetFilters: () => [],
    placeholder: '',
    label: '',
    showIcon: true,
    inputClass: '',
  }
);

const { t } = useI18n();

const resolvedPlaceholder = computed(() => props.placeholder || t('logs.filterPlaceholder'));

const resolvedLabel = computed(() => props.label || t('logs.filterLabel'));

const defaultPresetFilters = computed<SelectItemType[]>(() => [
  { value: 'none', label: t('logs.presets.none') },
  { value: 'OIDC', label: t('logs.presets.oidc') },
  { value: 'ERROR', label: t('logs.presets.error') },
  { value: 'WARNING', label: t('logs.presets.warning') },
  { value: 'AUTH', label: t('logs.presets.auth') },
]);

const resolvedPresetFilters = computed(() =>
  props.presetFilters.length ? props.presetFilters : defaultPresetFilters.value
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:preset': [value: string];
}>();

const filterText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
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
  },
});
</script>

<template>
  <div class="flex items-end gap-2">
    <div v-if="showPresets" class="min-w-[150px]">
      <Label v-if="resolvedLabel" :for="`preset-filter-${$.uid}`">
        {{ t('logs.quickFilterLabel', { label: resolvedLabel }) }}
      </Label>
      <Select
        :id="`preset-filter-${$.uid}`"
        v-model="presetValue"
        :items="resolvedPresetFilters"
        :placeholder="t('logs.selectFilterPlaceholder')"
        class="w-full"
      />
    </div>

    <div class="relative flex-1">
      <Label v-if="resolvedLabel && !showPresets" :for="`filter-input-${$.uid}`">
        {{ resolvedLabel }}
      </Label>
      <Label v-else-if="resolvedLabel && showPresets" :for="`filter-input-${$.uid}`">
        {{ t('logs.customFilterLabel', { label: resolvedLabel }) }}
      </Label>
      <div class="relative">
        <MagnifyingGlassIcon
          v-if="showIcon"
          class="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2"
        />
        <Input
          :id="`filter-input-${$.uid}`"
          v-model="filterText"
          type="text"
          :placeholder="resolvedPlaceholder"
          :class="[showIcon ? 'pl-8' : '', inputClass]"
        />
      </div>
    </div>
  </div>
</template>
