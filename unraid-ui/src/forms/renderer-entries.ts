import numberFieldRenderer from '@app/forms/NumberField.vue';
import PreconditionsLabel from '@app/forms/PreconditionsLabel.vue';
import selectRenderer from '@app/forms/Select.vue';
import StringArrayField from '@app/forms/StringArrayField.vue';
import switchRenderer from '@app/forms/Switch.vue';
import {
  and,
  isBooleanControl,
  isControl,
  isEnumControl,
  isIntegerControl,
  isNumberControl,
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

export const numberFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: numberFieldRenderer,
  tester: rankWith(4, or(isNumberControl, isIntegerControl)),
};

export const stringArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: StringArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isStringArray))),
};

export const preconditionsLabelEntry: JsonFormsRendererRegistryEntry = {
  renderer: PreconditionsLabel,
  tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
};
