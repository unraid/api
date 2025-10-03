<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/vue/24/outline';
import { Button } from '@unraid/ui';

import type { SelectItemType } from '@unraid/ui';

import LogFilterInput from '~/components/Logs/LogFilterInput.vue';

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    title: '',
    description: '',
    showToggle: false,
    isExpanded: true,
    showRefresh: true,
    showPresets: false,
    presetFilter: 'none',
    presetFilters: () => [],
    filterPlaceholder: '',
    filterLabel: '',
    compact: false,
  }
);

const { t } = useI18n();

const resolvedFilterPlaceholder = computed(() => props.filterPlaceholder || t('logs.filterPlaceholder'));

const resolvedFilterLabel = computed(() => props.filterLabel || t('logs.filterLabel'));

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

const refreshTitle = computed(() => t('logs.refreshLogs'));

const toggleLabel = computed(() => (props.isExpanded ? t('logs.hideLogs') : t('logs.showLogs')));

const emit = defineEmits<{
  'update:filterText': [value: string];
  'update:presetFilter': [value: string];
  'update:isExpanded': [value: boolean];
  refresh: [];
}>();

const filterValue = computed({
  get: () => props.filterText,
  set: (value) => emit('update:filterText', value),
});

const presetValue = computed({
  get: () => props.presetFilter || 'none',
  set: (value) => emit('update:presetFilter', value),
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
    <div class="flex items-center justify-between">
      <div v-if="title || description">
        <h3 v-if="title" :class="[compact ? 'text-sm' : 'text-base', 'font-semibold']">{{ title }}</h3>
        <p v-if="description" :class="['text-muted-foreground mt-1', compact ? 'text-xs' : 'text-sm']">
          {{ description }}
        </p>
      </div>

      <div class="flex items-center gap-2" :class="!title && !description ? 'w-full' : ''">
        <div :class="!title && !description ? 'flex-1' : ''">
          <LogFilterInput
            v-model="filterValue"
            v-model:preset="presetValue"
            :show-presets="showPresets"
            :preset-filters="resolvedPresetFilters"
            :placeholder="resolvedFilterPlaceholder"
            :label="compact || (!title && !description) ? resolvedFilterLabel : ''"
            :input-class="compact ? 'h-7 text-sm' : 'h-8'"
          />
        </div>

        <Button
          v-if="showRefresh"
          variant="outline"
          :size="compact ? 'sm' : 'sm'"
          :title="refreshTitle"
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
          <span v-if="!compact" class="ml-2">{{ toggleLabel }}</span>
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
