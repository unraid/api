<script setup lang="ts">
import { computed } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import useTeleport from '@/composables/useTeleport';
import { useJsonFormsControl } from '@jsonforms/vue';

import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const selected = computed(() => control.value.data);
const options = computed(() => {
  const enumValues: string[] = control.value.schema.enum || [];
  return enumValues.map((value) => ({
    value,
    label: value,
  }));
});

const onChange = (value: string) => {
  handleChange(control.value.path, value);
};

// Without this, the select dropdown will not be visible, unless it's already in a teleported context.
const { teleportTarget, determineTeleportTarget } = useTeleport();
const onSelectOpen = () => {
  determineTeleportTarget();
};
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
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
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          <SelectItemText>{{ option.label }}</SelectItemText>
        </SelectItem>
      </SelectContent>
    </Select>
  </ControlLayout>
</template>
