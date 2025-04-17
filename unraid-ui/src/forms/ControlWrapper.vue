<script setup lang="ts">
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import FormErrors from '@/forms/FormErrors.vue';

// Define props consistent with JsonForms renderers
const props = defineProps<RendererProps<ControlElement>>();

// Use the standard composable to get control state
const { control } = useJsonFormsControl(props);

</script>

<template>
  <!-- Only render the wrapper if the control is visible -->
  <div v-if="control.visible">
    <!-- Render the actual control passed via the default slot -->
    <slot />
    <!-- Automatically display errors below the control -->
    <FormErrors :errors="control.errors" />
  </div>
</template> 