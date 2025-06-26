<script setup lang="ts">
import {
  AccordionContent,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  class?: string;
}

const props = withDefaults(defineProps<AccordionProps>(), {
  type: 'single',
  collapsible: true,
});
</script>

<template>
  <AccordionRoot
    :type="type"
    :collapsible="collapsible"
    :default-value="defaultValue"
    :class="props.class"
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
      >
        <AccordionTrigger>
          <slot name="trigger" :item="item">
            {{ item.title }}
          </slot>
        </AccordionTrigger>
        <AccordionContent>
          <slot name="content" :item="item">
            {{ item.content }}
          </slot>
        </AccordionContent>
      </AccordionItem>
    </template>
  </AccordionRoot>
</template>
