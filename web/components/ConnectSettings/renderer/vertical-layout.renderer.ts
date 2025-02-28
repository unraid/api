import { and, isLayout, rankWith, uiTypeIs } from '@jsonforms/core';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import VerticalLayout from './VerticalLayout.vue';

export const verticalLayoutEntry: JsonFormsRendererRegistryEntry = {
  renderer: VerticalLayout,
  tester: rankWith(2, and(isLayout, uiTypeIs('VerticalLayout'))),
}; 