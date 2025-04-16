<script setup lang="ts">
import { rankWith, uiTypeIs, type UISchemaElement } from '@jsonforms/core';
import { rendererProps, useJsonFormsRenderer } from '@jsonforms/vue';
import { computed } from 'vue';

// Define a type for our specific Label UI Schema
interface LabelUISchema extends UISchemaElement {
  text?: string;
  options?: {
    description?: string;
    format?: 'title' | 'heading' | 'documentation' | string; // Add other formats as needed
  };
}

const props = defineProps(rendererProps<UISchemaElement>());

// Destructure the renderer ref from the hook's return value
const { renderer } = useJsonFormsRenderer(props);

// Cast the uischema inside the computed ref to our specific type
const typedUISchema = computed(() => renderer.value.uischema as LabelUISchema);

// Access properties via renderer.value
const labelText = computed(() => typedUISchema.value.text);
const descriptionText = computed(() => typedUISchema.value.options?.description);
const labelFormat = computed(() => typedUISchema.value.options?.format);

// --- Access visibility via renderer.value ---
const isVisible = computed(() => renderer.value.visible); // Use renderer.value.visible for visibility check

// Conditional classes or elements based on format
const labelClass = computed(() => {
  switch (labelFormat.value) {
    case 'title':
      return 'text-xl font-semibold mb-2'; // Example styling for title
    case 'heading':
      return 'text-lg font-medium mt-4 mb-1'; // Example styling for heading
    default:
      return 'font-medium'; // Default label styling
  }
});

const descriptionClass = computed(() => {
  switch (labelFormat.value) {
    case 'documentation':
      return 'text-sm text-gray-500 italic p-2 border-l-4 border-gray-300 bg-gray-50 my-2'; // Example styling for documentation
    default:
      return 'text-sm text-gray-600 mt-1'; // Default description styling
  }
});

// Use v-html for description if it might contain HTML (like the documentation link)
// Ensure any HTML is sanitized if it comes from untrusted sources.
// Assuming the documentation link is safe here.
const allowHtml = computed(() => labelFormat.value === 'documentation');

// --- Tester Export ---
export const labelRendererTester = rankWith(
  10, // Adjust rank as needed
  uiTypeIs('Label')
);
</script>

<template>
  <!-- Use the computed isVisible based on renderer.value.visible -->
  <div v-if="isVisible" class="my-2">
    <label v-if="labelText" :class="labelClass">{{ labelText }}</label>
    <p v-if="descriptionText && allowHtml" :class="descriptionClass" v-html="descriptionText" />
    <p v-else-if="descriptionText" :class="descriptionClass">{{ descriptionText }}</p>
  </div>
</template>
