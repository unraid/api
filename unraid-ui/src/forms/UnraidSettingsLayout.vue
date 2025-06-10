<script lang="ts" setup>
/**
 * UnraidSettingsLayout component
 *
 * Renders form elements defined in a UI schema within a two-column grid layout.
 * Typically used for settings pages where each row has a label on the left
 * and the corresponding form control on the right.
 * Consumes JSON Schema and UI Schema to determine what elements to render.
 *
 * @prop schema - The JSON Schema
 * @prop uischema - The UI Schema containing the layout elements
 * @prop path - The current path
 * @prop enabled - Whether the form is enabled
 * @prop renderers - Available renderers
 * @prop cells - Available cells
 */

import { useJsonFormsVisibility } from '@/forms/composables/useJsonFormsVisibility';
import type { HorizontalLayout } from '@jsonforms/core';
import { DispatchRenderer, type RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';

const props = defineProps<RendererProps<HorizontalLayout>>();

// Use the new composable
const { layout, isVisible } = useJsonFormsVisibility({ rendererProps: props });

const elements = computed(() => {
  // Access elements from the layout object returned by the composable
  return layout.layout.value.uischema.elements || [];
});
</script>

<template>
  <div
    v-if="isVisible"
    class="grid grid-cols-settings items-baseline pl-3 gap-y-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(even)]:ml-10"
  >
    <template v-for="(element, _i) in elements" :key="_i">
      <DispatchRenderer
        :schema="layout.layout.value.schema"
        :uischema="element"
        :path="layout.layout.value.path"
        :enabled="layout.layout.value.enabled"
        :renderers="layout.layout.value.renderers"
        :cells="layout.layout.value.cells"
      />
    </template>
  </div>
</template>
