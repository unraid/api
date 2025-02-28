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
  <div>
    <UuiSwitch
      :id="control.id + '-input'"
      :name="control.path"
      :disabled="!control.enabled"
      :hint="control.description"
      :required="control.required"
      :model-value="control.data as boolean"
      @update:checked="onChange"
    />
    <div v-if="control.errors" class="error-messages">
      <span v-for="(error, index) in control.errors" :key="index">{{ error }}</span>
    </div>
  </div>
</template>
