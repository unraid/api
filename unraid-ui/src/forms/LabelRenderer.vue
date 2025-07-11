<script setup lang="ts">
import Label from '@/components/form/label/Label.vue';
import { Markdown } from '@/lib/utils';
import { type UISchemaElement } from '@jsonforms/core';
import { rendererProps, useJsonFormsRenderer } from '@jsonforms/vue';
import { computed, ref, watchEffect } from 'vue';

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

// --- Parsed Description ---
const parsedDescription = ref<string | null>(null);

watchEffect(async () => {
  // console.log('descriptionText', descriptionText.value); // Removed
  const desc = descriptionText.value;
  if (desc) {
    try {
      parsedDescription.value = await Markdown.parse(desc);
      // console.log('parsedDescription after parse:', parsedDescription.value); // Removed
    } catch (error) {
      console.error('Error parsing markdown in LabelRenderer:', error);
      // Fallback to plain text if parsing fails
      parsedDescription.value = desc;
    }
  } else {
    parsedDescription.value = null;
  }
});

// Conditional classes or elements based on format
const labelClass = computed(() => {
  switch (labelFormat.value) {
    case 'title':
      return 'text-xl font-semibold mb-2'; // Example styling for title
    case 'heading':
      return 'text-lg font-semibold mt-4 mb-1'; // Example styling for heading
    default:
      return 'font-semibold'; // Default label styling
  }
});

const descriptionClass = computed(() => {
  switch (labelFormat.value) {
    case 'documentation':
      return 'text-sm text-gray-500 italic p-2 border-l-4 border-gray-300 bg-gray-50 my-2 font-bold'; // Example styling for documentation
    default:
      return 'text-sm text-gray-600 mt-1'; // Default description styling
  }
});
</script>

<template>
  <!-- Use the computed isVisible based on renderer.value.visible -->
  <div class="flex flex-col gap-2 flex-shrink-0">
    <!-- Replace native label with the Label component -->
    <Label v-if="labelText" :class="labelClass">{{ labelText }}</Label>
    <!-- Use v-html with the parsedDescription ref -->
    <p v-if="parsedDescription" :class="descriptionClass" v-html="parsedDescription" />
  </div>
</template>
