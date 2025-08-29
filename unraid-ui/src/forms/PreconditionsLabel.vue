<script setup lang="ts">
import type { LabelElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';

type PreconditionsLabelElement = LabelElement & {
  options: {
    format: 'preconditions';
    /** A description of the setting this element represents, and context for the preconditions. */
    description?: string;
    items: {
      /** The text to display in the list item, representing each precondition. e.g. "API is enabled" */
      text: string;
      /** Whether the precondition is met. */
      status: boolean;
    }[];
  };
};

// The renderer expects the uischema element to have a `text` property
// and `options.items` which is an array of precondition items.
// Each item should have a `text` and a `status` (boolean) property.
const props = defineProps<RendererProps<PreconditionsLabelElement>>();

const items = computed(() => props.uischema.options?.items || []);
const description = computed(() => props.uischema.options?.description);
</script>

<template>
  <!-- Render each precondition as a list item with an icon bullet -->
  <div>
    <p v-if="description" class="mb-2">{{ description }}</p>
    <ul class="list-none space-y-1">
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <span v-if="item.status" class="mr-2 font-bold text-green-500">✓</span>
        <span v-else class="mr-2 font-extrabold text-red-500">✕</span>
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>
