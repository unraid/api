import type { JsonFormsRendererRegistryEntry, JsonSchema } from '@jsonforms/core';
import { and, isControl, rankWith, schemaMatches } from '@jsonforms/core';
import StringArrayField from './StringArrayField.vue';

const isStringArray = (schema: JsonSchema): boolean => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  const items = schema.items as JsonSchema;
  return schema.type === 'array' && items?.type === 'string';
};

export const stringArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: StringArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isStringArray))),
}; 