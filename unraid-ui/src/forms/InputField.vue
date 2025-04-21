<script setup lang="ts">
import { Input } from '@/components/form/input';
import { cn } from '@/lib/utils';
import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';
import { useJsonFormsControl } from '@jsonforms/vue';
import { computed } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Bind the input field's value to JSONForms data
const value = computed({
  get: () => control.value.data ?? control.value.schema.default ?? '',
  set: (newValue: string) => handleChange(control.value.path, newValue || undefined),
});

// Determine the input type based on schema format
const inputType = computed(() => {
  return control.value.schema.format === 'password' ? 'password' : 'text';
});

const classOverride = computed(() => {
  return cn(control.value.uischema?.options?.class, {
    'max-w-[25ch]': control.value.uischema?.options?.format === 'short',
  });
});
</script>

<template>
  <Input
    v-model="value"
    :type="inputType"
    :class="cn('flex-grow', classOverride)"
    :disabled="!control.enabled"
    :required="control.required"
    :placeholder="control.schema.description"
  />
</template>
