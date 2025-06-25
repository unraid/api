<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/common/tooltip';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/form/combobox';
import useTeleport from '@/composables/useTeleport';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref, watch } from 'vue';

interface Suggestion {
  value: string;
  label?: string;
  tooltip?: string;
}
const { teleportTarget } = useTeleport();
const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const inputValue = ref(control.value.data ?? '');

const isOpen = ref(false);

const suggestions = computed<Suggestion[]>(() => {
  return control.value.uischema.options?.suggestions || [];
});

const handleInput = (event: Event) => {
  inputValue.value = (event.target as HTMLInputElement).value;
};

const handleSelect = (event: CustomEvent<{ value?: AcceptableValue }>) => {
  if (event.detail.value === undefined || event.detail.value === null) return;
  const stringValue = String(event.detail.value);
  inputValue.value = stringValue;
  handleChange(control.value.path, stringValue);
  isOpen.value = false;
};

const handleOpenChange = (open: boolean) => {
  isOpen.value = open;
  if (!open) {
    if (control.value.uischema.options?.strictSuggestions && suggestions.value.length > 0) {
      const isValid = suggestions.value.some(
        (suggestion) => suggestion.value === inputValue.value || suggestion.label === inputValue.value
      );
      if (!isValid) {
        inputValue.value = control.value.data || '';
        return;
      }
    }
    handleChange(control.value.path, inputValue.value);
  }
};

watch(
  () => control.value.data,
  (newValue) => {
    const currentVal = newValue ?? '';
    if (currentVal !== inputValue.value) {
      inputValue.value = currentVal;
    }
  }
);

if (control.value.data !== undefined && control.value.data !== null) {
  inputValue.value = String(control.value.data);
}
</script>

<template>
  <Combobox :open="isOpen" @update:open="handleOpenChange">
    <ComboboxAnchor>
      <ComboboxTrigger>
        <ComboboxInput
          :id="control.id"
          :value="inputValue"
          @input="handleInput"
          :placeholder="control.uischema.options?.placeholder"
          :disabled="!control.enabled"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList>
      <ComboboxEmpty class="p-2 text-sm text-muted-foreground"> No suggestions found </ComboboxEmpty>

      <template v-for="suggestion in suggestions" :key="suggestion.value">
        <TooltipProvider v-if="suggestion.tooltip">
          <Tooltip :delay-duration="50">
            <TooltipTrigger as-child>
              <ComboboxItem
                :value="suggestion.value"
                @select="handleSelect"
                class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <span>{{ suggestion.label || suggestion.value }}</span>
              </ComboboxItem>
            </TooltipTrigger>
            <TooltipContent :to="teleportTarget" side="right" :side-offset="5">
              <p class="max-w-xs">{{ suggestion.tooltip }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ComboboxItem
          v-else
          :value="suggestion.value"
          @select="handleSelect"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
        >
          <span>{{ suggestion.label || suggestion.value }}</span>
        </ComboboxItem>
      </template>
    </ComboboxList>
  </Combobox>
</template>
