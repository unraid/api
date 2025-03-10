<script setup lang="ts">
import { computed } from 'vue';

import {
  cn,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@unraid/ui';
import { useJsonFormsControl } from '@jsonforms/vue';

import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Bind the number field's value to JSONForms data
const value = computed({
  get: () => control.value.data ?? 0, // Default to 0 if no value exists
  set: (newValue: number) => handleChange(control.value.path, newValue),
});
// Extract schema-based constraints (optional settings)
const min = computed(() => control.value.schema.minimum ?? Number.MIN_SAFE_INTEGER);
const max = computed(() => control.value.schema.maximum ?? Number.MAX_SAFE_INTEGER);
const step = computed(() => control.value.schema.multipleOf ?? 1);
const formatOptions = computed(() => control.value.uischema?.options?.formatOptions || {});
const classOverride = computed(() => {
  return cn(control.value.uischema?.options?.class, {
    'max-w-[25ch]': control.value.uischema?.options?.format === 'short',
  });
});
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
    <NumberField
      v-model="value"
      :min="min"
      :max="max"
      :step="step"
      :format-options="formatOptions"
      :class="classOverride"
      :disabled="!control.enabled"
    >
      <NumberFieldDecrement />
      <NumberFieldInput />
      <NumberFieldIncrement />
    </NumberField>
  </ControlLayout>
</template>
