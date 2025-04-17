<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/common/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import useTeleport from '@/composables/useTeleport';
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

// Without this, the select dropdown will not be visible, unless it's already in a teleported context.
const { teleportTarget, determineTeleportTarget } = useTeleport();
const onSelectOpen = () => {
  determineTeleportTarget();
};
</script>

<template>
  <!-- The ControlWrapper now handles the v-if based on control.visible -->
  <Select
    v-model="selected"
    :disabled="!control.enabled"
    :required="control.required"
    @update:model-value="onChange"
    @update:open="onSelectOpen"
  >
    <!-- The trigger shows the currently selected value (if any) -->
    <SelectTrigger>
      <SelectValue v-if="selected">{{ selected }}</SelectValue>
      <span v-else>{{ control.schema.default ?? 'Select an option' }}</span>
    </SelectTrigger>
    <!-- The content includes the selectable options -->
    <SelectContent :to="teleportTarget">
      <template v-for="option in options" :key="option.value">
        <TooltipProvider v-if="option.tooltip" :delay-duration="50">
          <Tooltip>
            <TooltipTrigger as-child>
              <SelectItem :value="option.value">
                <SelectItemText>{{ option.label }}</SelectItemText>
              </SelectItem>
            </TooltipTrigger>
            <TooltipContent :to="teleportTarget" side="right" :side-offset="5">
              <p class="max-w-xs">{{ option.tooltip }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <SelectItem v-else :value="option.value">
          <SelectItemText>{{ option.label }}</SelectItemText>
        </SelectItem>
      </template>
    </SelectContent>
  </Select>
</template>
