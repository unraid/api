<script setup lang="ts">
import { computed } from 'vue';

import type { LabelElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

type PreconditionsLabelElement = LabelElement & {
  options: {
    format: 'preconditions';
    description?: string;
    items: {
      text: string;
      status: boolean;
    }[];
  };
};

// The renderer expects the uischema element to have a `text` property
// and `options.items` which is an array of precondition items.
// Each item should have a `text` and a `status` (boolean) property.
const props = defineProps<RendererProps<PreconditionsLabelElement>>();

const labelText = computed(() => props.uischema.text);
const items = computed(() => props.uischema.options?.items || []);
const description = computed(() => props.uischema.options?.description);
</script>

<template>
  <ControlLayout :label="labelText">
    <!-- Render each precondition as a list item with an icon bullet -->
    <p v-if="description" class="mb-2">{{ description }}</p>
    <ul class="list-none space-y-1">
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <span v-if="item.status" class="text-green-500 mr-2 font-bold">✓</span>
        <span v-else class="text-red-500 mr-2 font-extrabold">✕</span>
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </ControlLayout>
</template>
