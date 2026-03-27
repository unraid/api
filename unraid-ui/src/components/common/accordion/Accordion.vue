<script setup lang="ts">
import {
  AccordionContent,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { computed, ref, watch } from 'vue';

export interface AccordionItemData {
  value: string;
  title: string;
  content?: string;
  disabled?: boolean;
}

export interface AccordionProps {
  items?: AccordionItemData[];
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  modelValue?: string | string[];
  class?: string;
  itemClass?: string;
  triggerClass?: string;
}

const props = withDefaults(defineProps<AccordionProps>(), {
  type: 'single',
  collapsible: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]];
}>();

const openValue = ref<string | string[] | undefined>(props.modelValue ?? props.defaultValue);

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) openValue.value = val;
  }
);

function isItemOpen(itemValue: string): boolean {
  if (!openValue.value) return false;
  if (Array.isArray(openValue.value)) return openValue.value.includes(itemValue);
  return openValue.value === itemValue;
}

function handleUpdate(value: string | string[]) {
  openValue.value = value;
  emit('update:modelValue', value);
}
</script>

<template>
  <AccordionRoot
    :type="type"
    :collapsible="collapsible"
    :default-value="defaultValue"
    :model-value="openValue"
    :class="props.class"
    @update:model-value="handleUpdate"
  >
    <!-- Default slot for direct composition -->
    <slot />

    <!-- Props-based usage for simple cases -->
    <template v-if="items && items.length > 0">
      <AccordionItem
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled"
        :class="props.itemClass"
      >
        <AccordionTrigger :class="props.triggerClass">
          <slot name="trigger" :item="item" :open="isItemOpen(item.value)">
            {{ item.title }}
          </slot>
        </AccordionTrigger>
        <AccordionContent>
          <slot name="content" :item="item" :open="isItemOpen(item.value)">
            {{ item.content }}
          </slot>
        </AccordionContent>
      </AccordionItem>
    </template>
  </AccordionRoot>
</template>
