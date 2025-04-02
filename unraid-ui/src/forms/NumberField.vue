<script setup lang="ts">
import { computed } from 'vue';

import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';
import { useJsonFormsControl } from '@jsonforms/vue';

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/form/number';
import { cn } from '@/lib/utils';

import ControlLayout from './ControlLayout.vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Bind the number field's value to JSONForms data
const value = computed({
  get: () => control.value.data ?? control.value.schema.default,
  set: (newValue: number) => handleChange(control.value.path, newValue),
});
// Extract schema-based constraints (optional settings)
const min = computed(() => control.value.schema.minimum);
const max = computed(() => control.value.schema.maximum);
const step = computed(() => control.value.schema.multipleOf ?? 1);
const stepperEnabled = computed(() => Boolean(control.value.uischema?.options?.stepper));
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
      :required="control.required"
      blah="true"
      :blah-2="true"
    >
      <NumberFieldDecrement v-if="stepperEnabled" />
      <NumberFieldInput />
      <NumberFieldIncrement v-if="stepperEnabled" />
    </NumberField>
  </ControlLayout>
</template>
