<script setup lang="ts">
import { Input } from '@/components/form/input';
import { cn } from '@/lib/utils';
import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';
import { useJsonFormsControl } from '@jsonforms/vue';
import { Eye, EyeOff } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Bind the input field's value to JSONForms data
const value = computed({
  get: () => control.value.data ?? control.value.schema.default ?? '',
  set: (newValue: string) => handleChange(control.value.path, newValue || undefined),
});

// Track password visibility
const showPassword = ref(false);

// Determine the input type based on schema format and visibility state
const inputType = computed(() => {
  if (control.value.schema.format === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return 'text';
});

const isPassword = computed(() => control.value.schema.format === 'password');

const classOverride = computed(() => {
  return cn(control.value.uischema?.options?.class, {
    'max-w-[25ch]': control.value.uischema?.options?.format === 'short',
  });
});

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="relative">
    <Input
      v-model="value"
      :type="inputType"
      :class="cn('grow', classOverride, { 'pr-10': isPassword })"
      :disabled="!control.enabled"
      :required="control.required"
      :placeholder="control.schema.description"
    />
    <button
      v-if="isPassword"
      type="button"
      @click="togglePasswordVisibility"
      class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-500"
      tabindex="-1"
    >
      <Eye v-if="!showPassword" class="h-4 w-4" />
      <EyeOff v-else class="h-4 w-4" />
    </button>
  </div>
</template>
