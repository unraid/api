import VerticalLayout from '@app/forms/VerticalLayout.vue';
import { and, isLayout, rankWith, uiTypeIs } from '@jsonforms/core';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';

export const verticalLayoutEntry: JsonFormsRendererRegistryEntry = {
  renderer: VerticalLayout,
  tester: rankWith(2, and(isLayout, uiTypeIs('VerticalLayout'))),
};
