<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/common/tooltip';
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const selected = computed(() => control.value.data);
const options = computed(() => {
  const enumValues: string[] = control.value.schema.enum || [];
  const tooltips: string[] | undefined = control.value.uischema.options?.tooltips;

  return enumValues.map((value, index) => ({
    value,
    label: value,
    tooltip: tooltips && tooltips[index] ? tooltips[index] : undefined,
  }));
});

const onChange = (value: unknown) => {
  handleChange(control.value.path, String(value));
};
</script>

<template>
  <SelectRoot
    v-model="selected"
    :disabled="!control.enabled"
    :required="control.required"
    @update:model-value="onChange"
  >
    <SelectTrigger>
      <SelectValue v-if="selected">{{ selected }}</SelectValue>
      <span v-else>{{ control.schema.default ?? 'Select an option' }}</span>
    </SelectTrigger>

    <SelectContent>
      <template v-for="option in options" :key="option.value">
        <TooltipProvider v-if="option.tooltip" :delay-duration="50">
          <Tooltip>
            <TooltipTrigger as-child>
              <SelectItem :value="option.value">
                <SelectItemText>{{ option.label }}</SelectItemText>
              </SelectItem>
            </TooltipTrigger>
            <TooltipContent side="right" :side-offset="5">
              <p class="max-w-xs">{{ option.tooltip }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <SelectItem v-else :value="option.value">
          <SelectItemText>{{ option.label }}</SelectItemText>
        </SelectItem>
      </template>
    </SelectContent>
  </SelectRoot>
</template>
