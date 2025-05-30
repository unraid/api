<script lang="ts" setup>
/**
 * HorizontalLayout component
 *
 * Renders form elements in a horizontal layout with labels aligned to the right
 * and fields to the left. Consumes JSON Schema uischema to determine what elements
 * to render.
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
  <div v-if="isVisible" class="flex flex-row gap-2 items-baseline">
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
