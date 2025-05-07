<script setup lang="ts">
import { Switch as UuiSwitch } from '@/components/form/switch';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);
const onChange = (checked: boolean) => {
  handleChange(control.value.path, checked);
};
</script>

<template>
  <UuiSwitch
    :id="control.id + '-input'"
    :name="control.path"
    :disabled="!control.enabled"
    :required="control.required"
    :modelValue="Boolean(control.data)"
    @update:modelValue="onChange"
  />
</template>
