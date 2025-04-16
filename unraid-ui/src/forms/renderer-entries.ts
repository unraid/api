import CategorizationAccordionRenderer from '@/forms/CategorizationAccordionRenderer.vue';
import comboBoxRenderer from '@/forms/ComboBoxField.vue';
import inputFieldRenderer from '@/forms/InputField.vue';
import MissingRenderer from '@/forms/MissingRenderer.vue';
import numberFieldRenderer from '@/forms/NumberField.vue';
import PreconditionsLabel from '@/forms/PreconditionsLabel.vue';
import selectRenderer from '@/forms/Select.vue';
import StringArrayField from '@/forms/StringArrayField.vue';
import switchRenderer from '@/forms/Switch.vue';
import {
  and,
  isBooleanControl,
  isCategorization,
  isControl,
  isEnumControl,
  isIntegerControl,
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

export const formSwitchEntry: JsonFormsRendererRegistryEntry = {
  renderer: switchRenderer,
  tester: rankWith(4, and(isBooleanControl, optionIs('toggle', true))),
};

export const formSelectEntry: JsonFormsRendererRegistryEntry = {
  renderer: selectRenderer,
  tester: rankWith(4, and(isEnumControl)),
};

export const formComboBoxEntry: JsonFormsRendererRegistryEntry = {
  renderer: comboBoxRenderer,
  tester: rankWith(4, and(isEnumControl, optionIs('type', 'combobox'))),
};

export const numberFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: numberFieldRenderer,
  tester: rankWith(4, or(isNumberControl, isIntegerControl)),
};

export const inputFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: inputFieldRenderer,
  tester: rankWith(3, isStringControl),
};

export const stringArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: StringArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isStringArray))),
};

export const preconditionsLabelEntry: JsonFormsRendererRegistryEntry = {
  renderer: PreconditionsLabel,
  tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
};

export const missingRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: MissingRenderer,
  tester: rankWith(3, isControl),
};

export const categorizationAccordionEntry: JsonFormsRendererRegistryEntry = {
  renderer: CategorizationAccordionRenderer,
  tester: rankWith(5, isCategorization),
};
