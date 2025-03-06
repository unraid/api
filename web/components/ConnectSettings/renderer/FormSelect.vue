<script setup lang="ts">
import { computed } from 'vue';

// Import your shadcn-vue Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@unraid/ui';
import { useJsonFormsControl } from '@jsonforms/vue';

// Import the prop types for a JSONForms renderer.
// (Adjust the import path based on your JSONForms Vue integration)
import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

// Define the component props expected by JSONForms.
const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Create a local ref for the currently selected value.
// If no value exists, default it to an empty string.
const selected = computed(() => control.value.data);
// Create a computed property to extract options from the JSON Schema.
// We expect that the schema contains an "enum" array. Optionally, it may
// include an "enumNames" array for display labels.
const options = computed(() => {
  const enumValues: string[] = control.value.schema.enum || [];
  return enumValues.map((value) => ({
    value,
    label: value,
  }));
});

// Update JSONForms data when the local selection changes.
const onChange = (value: string) => {
  console.log('onChange', value);
  handleChange(control.value.path, value);
};
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
    <Select v-model="selected" @update:model-value="onChange">
      <!-- The trigger shows the currently selected value (if any) -->
      <SelectTrigger>
        <SelectValue v-if="selected">{{ selected }}</SelectValue>
        <span v-else>{{ control.schema.default ?? 'Select an option' }}</span>
      </SelectTrigger>
      <!-- The content includes the selectable options -->
      <SelectContent>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          <SelectItemText>{{ option.label }}</SelectItemText>
        </SelectItem>
      </SelectContent>
    </Select>
  </ControlLayout>
</template>
