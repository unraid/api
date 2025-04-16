import SteppedLayout from '@/forms/SteppedLayout.vue';
import { and, isLayout, rankWith, uiTypeIs } from '@jsonforms/core';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';

/**
 * Renderer entry for SteppedLayout.
 * It looks for a UI schema element of type 'Layout' and uiType 'SteppedLayout'.
 */
export const steppedLayoutEntry: JsonFormsRendererRegistryEntry = {
  renderer: SteppedLayout,
  // Rank 3 to be slightly more specific than VerticalLayout (rank 2)
  tester: rankWith(3, and(isLayout, uiTypeIs('SteppedLayout'))),
}; 