<script lang="ts" setup>
/**
 * VerticalLayout component
 *
 * Renders form elements in a vertical layout with labels aligned to the right
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

import type { VerticalLayout } from '@jsonforms/core';
import { DispatchRenderer, type RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';
import { useJsonFormsVisibility } from './composables/useJsonFormsVisibility';

const props = defineProps<RendererProps<VerticalLayout>>();

const { layout, isVisible } = useJsonFormsVisibility({ rendererProps: props });

const elements = computed(() => {
  return layout.layout.value.uischema.elements || [];
});
</script>

<template>
  <div v-if="isVisible" class="flex flex-col gap-y-2">
    <template v-for="(element, index) in elements" :key="index">
      <DispatchRenderer
        class="ml-10"
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
