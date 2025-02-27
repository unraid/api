<script lang="ts">
import { defineComponent } from 'vue';

import { Label as UuiLabel, Switch as UuiSwitch } from '@unraid/ui';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';

import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

const controlRenderer = defineComponent({
  name: 'BooleanToggleControlRenderer',
  components: {
    UuiSwitch,
    UuiLabel,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useJsonFormsControl(props);
  },
});

export default controlRenderer;
</script>

<template>
  <div class="flex items-center gap-2">
    <UuiSwitch
      :id="control.id + '-input'"
      :name="control.path"
      :disabled="!control.enabled"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :model-value="control.data as boolean"
    />
    <UuiLabel>{{ control.label }}</UuiLabel>
  </div>
</template>
