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

import selectRenderer from './Select.vue';
import switchRenderer from './Switch.vue';
import numberFieldRenderer from './NumberField.vue';
import PreconditionsLabel from './PreconditionsLabel.vue';
import StringArrayField from './StringArrayField.vue';

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

export const preconditionsLabelEntry: JsonFormsRendererRegistryEntry = {
  renderer: PreconditionsLabel,
  tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
};

export const stringArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: StringArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isStringArray))),
};
