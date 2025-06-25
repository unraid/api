<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { computed } from 'vue';

type SelectValueType = string | number;

type AcceptableValue = SelectValueType | SelectValueType[] | Record<string, unknown> | null;

interface SelectItemInterface {
  label: string;
  value: SelectValueType;
  disabled?: boolean;
  class?: string;
  [key: string]: unknown;
}

interface SelectLabelInterface {
  type: 'label';
  label: string;
}

interface SelectSeparatorInterface {
  type: 'separator';
}

// Union type for all possible items
export type SelectItemType =
  | SelectItemInterface
  | SelectLabelInterface
  | SelectSeparatorInterface
  | SelectValueType;

export interface SelectProps {
  modelValue?: AcceptableValue;
  items?: SelectItemType[] | SelectItemType[][];
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  class?: string;
  valueKey?: string;
  labelKey?: string;
}

const props = withDefaults(defineProps<SelectProps>(), {
  items: () => [],
  multiple: false,
  valueKey: 'value',
  labelKey: 'label',
});

const emit = defineEmits<{
  'update:modelValue': [value: AcceptableValue];
}>();

function isStructuredItem(item: SelectItemType): item is SelectItemInterface {
  return typeof item === 'object' && item !== null && 'value' in item;
}

function isLabelItem(item: SelectItemType): item is SelectLabelInterface {
  return typeof item === 'object' && item !== null && 'type' in item && item.type === 'label';
}

function isSeparatorItem(item: SelectItemType): item is SelectSeparatorInterface {
  return typeof item === 'object' && item !== null && 'type' in item && item.type === 'separator';
}

function getItemLabel(item: SelectItemType): string {
  if (isStructuredItem(item)) {
    return String(item[props.labelKey] || item.label || item.value);
  }

  if (isLabelItem(item)) return item.label;
  return String(item);
}

// Get value for an item
function getItemValue(item: SelectItemType): SelectValueType | null {
  if (isStructuredItem(item)) {
    const value = item[props.valueKey] || item.value;

    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  if (isLabelItem(item) || isSeparatorItem(item)) return null;
  return item;
}

function isGroupedItems(items: SelectItemType[] | SelectItemType[][]): items is SelectItemType[][] {
  return Array.isArray(items) && items.length > 0 && Array.isArray(items[0]);
}

const itemGroups = computed(() => {
  if (!props.items) return [];

  return isGroupedItems(props.items) ? props.items : [props.items];
});

const flatItems = computed(() => {
  return itemGroups.value.flat();
});

const renderableItems = computed(() => {
  return flatItems.value.filter((item) => !isLabelItem(item) && !isSeparatorItem(item));
});

const groupedOrderedItems = computed(() => {
  return itemGroups.value.map((group, groupIndex) => ({
    groupIndex,
    items: group.map((item, index) => ({
      item,
      index,
      type: isLabelItem(item) ? 'label' : isSeparatorItem(item) ? 'separator' : 'item',
    })),
  }));
});

const isMultipleSelection = computed(() => {
  return props.multiple && Array.isArray(props.modelValue) && props.modelValue.length > 0;
});

const multipleValueDisplay = computed(() => {
  if (!isMultipleSelection.value || !Array.isArray(props.modelValue)) return '';

  const values = props.modelValue as SelectValueType[];
  const displayLabels = values.map((value) => {
    const item = renderableItems.value.find((item) => {
      const itemValue = getItemValue(item);

      return itemValue === value;
    });
    return item ? getItemLabel(item) : String(value);
  });

  if (displayLabels.length <= 2) {
    return displayLabels.join(', ');
  } else {
    return `${displayLabels[0]}, ${displayLabels[1]} +${displayLabels.length - 2} more`;
  }
});

function handleUpdateModelValue(value: AcceptableValue) {
  emit('update:modelValue', value);
}
</script>

<template>
  <SelectRoot
    :model-value="props.modelValue"
    :multiple="props.multiple"
    :disabled="props.disabled"
    :required="props.required"
    :name="props.name"
    @update:model-value="handleUpdateModelValue"
  >
    <SelectTrigger :class="props.class">
      <slot>
        <SelectValue :placeholder="props.placeholder">
          <template v-if="isMultipleSelection">
            {{ multipleValueDisplay }}
          </template>
        </SelectValue>
      </slot>
    </SelectTrigger>

    <SelectContent>
      <slot name="content-top" />

      <SelectGroup v-for="{ groupIndex, items } in groupedOrderedItems" :key="groupIndex">
        <template v-for="{ item, index, type } in items" :key="index">
          <SelectLabel v-if="type === 'label'">
            {{ getItemLabel(item) }}
          </SelectLabel>

          <SelectSeparator v-if="type === 'separator'" />

          <SelectItem
            v-if="type === 'item'"
            :value="getItemValue(item) || ''"
            :disabled="isStructuredItem(item) ? item.disabled : false"
            :class="isStructuredItem(item) ? item.class : undefined"
          >
            <slot name="item" :item="item" :index="index">
              {{ getItemLabel(item) }}
            </slot>
          </SelectItem>
        </template>
      </SelectGroup>
      <slot name="content-bottom" />
    </SelectContent>
  </SelectRoot>
</template>
