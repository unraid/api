<script setup lang="ts">
import { Label as UuiLabel, Switch as UuiSwitch } from '@unraid/ui';
import { useJsonFormsControl } from '@jsonforms/vue';

import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);
const onChange = (checked: boolean) => {
  handleChange(control.value.path, checked);
};
</script>

<template>
  <div class="grid gap-6 grid-cols-2 items-center">
    <UuiLabel class="text-end">{{ control.label }}</UuiLabel>
    <UuiSwitch
      :id="control.id + '-input'"
      :name="control.path"
      :disabled="!control.enabled"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :model-value="control.data as boolean"
      @update:checked="onChange"
    />
  </div>
</template>
