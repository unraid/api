import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import {
  formSelectEntry,
  formSwitchEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  stringArrayEntry,
} from './renderer-entries';

/**
 * JSONForms renderers for Unraid UI
 *
 * This file exports a list of JSONForms renderers that are used in the Unraid UI.
 * It combines the vanilla renderers with the custom renderers defined in
 * `@unraid/ui/src/forms/renderer-entries.ts`.
 */
export const jsonFormsRenderers = [
  ...vanillaRenderers,
  formSwitchEntry,
  formSelectEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  stringArrayEntry,
];
