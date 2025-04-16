import CategorizationAccordionRenderer from '@/forms/CategorizationAccordionRenderer.vue';
import comboBoxRenderer from '@/forms/ComboBoxField.vue';
import inputFieldRenderer from '@/forms/InputField.vue';
import MissingRenderer from '@/forms/MissingRenderer.vue';
import numberFieldRenderer from '@/forms/NumberField.vue';
import PreconditionsLabel from '@/forms/PreconditionsLabel.vue';
import selectRenderer from '@/forms/Select.vue';
import SteppedLayout from '@/forms/SteppedLayout.vue';
import StringArrayField from '@/forms/StringArrayField.vue';
import switchRenderer from '@/forms/Switch.vue';
import VerticalLayout from '@/forms/VerticalLayout.vue';
import {
  and,
  isBooleanControl,
  isCategorization,
  isControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isNumberControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import type { JsonFormsRendererRegistryEntry, JsonSchema } from '@jsonforms/core';

const isStringArray = (schema: JsonSchema): boolean => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  const items = schema.items as JsonSchema;
  return schema.type === 'array' && items?.type === 'string';
};

const formSwitchEntry: JsonFormsRendererRegistryEntry = {
  renderer: switchRenderer,
  tester: rankWith(4, and(isBooleanControl, optionIs('toggle', true))),
};

const formSelectEntry: JsonFormsRendererRegistryEntry = {
  renderer: selectRenderer,
  tester: rankWith(4, and(isEnumControl)),
};

const formComboBoxEntry: JsonFormsRendererRegistryEntry = {
  renderer: comboBoxRenderer,
  tester: rankWith(4, and(isControl, optionIs('type', 'combobox'))),
};

const numberFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: numberFieldRenderer,
  tester: rankWith(4, or(isNumberControl, isIntegerControl)),
};

const inputFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: inputFieldRenderer,
  tester: rankWith(3, isStringControl),
};

const stringArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: StringArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isStringArray))),
};

const preconditionsLabelEntry: JsonFormsRendererRegistryEntry = {
  renderer: PreconditionsLabel,
  tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
};

const missingRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: MissingRenderer,
  tester: rankWith(3, isControl),
};

const categorizationAccordionEntry: JsonFormsRendererRegistryEntry = {
  renderer: CategorizationAccordionRenderer,
  tester: rankWith(5, isCategorization),
};

const verticalLayoutEntry: JsonFormsRendererRegistryEntry = {
  renderer: VerticalLayout,
  tester: rankWith(2, and(isLayout, uiTypeIs('VerticalLayout'))),
};

const steppedLayoutEntry: JsonFormsRendererRegistryEntry = {
  renderer: SteppedLayout,
  tester: rankWith(3, and(isLayout, uiTypeIs('SteppedLayout'))),
};

/**
 * JSONForms renderers for Unraid UI
 *
 * This file exports a list of JSONForms renderers that are used in the Unraid UI.
 * It combines the vanilla renderers with the custom renderers defined in
 * `@unraid/ui/src/forms/renderer-entries.ts`.
 */
export const jsonFormsRenderers = [
  verticalLayoutEntry,
  steppedLayoutEntry,
  formSwitchEntry,
  formSelectEntry,
  formComboBoxEntry,
  inputFieldEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  stringArrayEntry,
  missingRendererEntry,
  categorizationAccordionEntry,
];
