<script setup lang="ts">
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/form/combobox';
import { cn } from '@/lib/utils';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref, watch } from 'vue';

interface Suggestion {
  value: string;
  label?: string;
}

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const selected = computed(() => control.value.data);
const isOpen = ref(false);

// Get suggestions from the control's options
const suggestions = computed<Suggestion[]>(() => {
  return control.value.uischema.options?.suggestions || [];
});

// Handle input changes
const handleInput = (value: AcceptableValue) => {
  if (value === null) return;
  const stringValue = String(value);
  handleChange(control.value.path, stringValue);
};

// Handle selection
const handleSelect = (event: CustomEvent<{ value?: AcceptableValue }>) => {
  if (!event.detail.value) return;
  const stringValue = String(event.detail.value);
  handleChange(control.value.path, stringValue);
  isOpen.value = false;
};

// Watch for external value changes
watch(
  () => control.value.data,
  (newValue) => {
    if (newValue !== selected.value) {
      handleChange(control.value.path, newValue || '');
    }
  }
);
</script>

<template>
  <div v-if="control.visible" class="flex flex-col gap-2">
    <label v-if="control.label" :for="control.id" class="text-sm font-medium">
      {{ control.label }}
    </label>

    <Combobox
      v-model="selected"
      @update:modelValue="handleInput"
      :open="isOpen"
      @update:open="isOpen = $event"
    >
      <div class="relative">
        <ComboboxInput
          :id="control.id"
          :placeholder="control.uischema.options?.placeholder"
          :disabled="!control.enabled"
          :class="
            cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              control.errors ? 'border-destructive' : ''
            )
          "
        />

        <ComboboxList
          class="absolute z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <ComboboxEmpty class="p-2 text-sm text-muted-foreground"> No suggestions found </ComboboxEmpty>

          <ComboboxItem
            v-for="suggestion in suggestions"
            :key="suggestion.value"
            :value="suggestion.value"
            @select="handleSelect"
            class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            {{ suggestion.label || suggestion.value }}
          </ComboboxItem>
        </ComboboxList>
      </div>
    </Combobox>

    <div v-if="control.errors" class="text-sm text-destructive">
      {{ control.errors }}
    </div>

    <div v-if="control.description" class="text-sm text-muted-foreground">
      {{ control.description }}
    </div>
  </div>
</template>
