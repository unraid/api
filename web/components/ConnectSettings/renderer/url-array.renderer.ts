import type { JsonFormsRendererRegistryEntry, JsonSchema } from '@jsonforms/core';
import { and, isControl, rankWith, schemaMatches } from '@jsonforms/core';
import UrlArrayField from './UrlArrayField.vue';

const isUrlArray = (schema: JsonSchema): boolean => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  const items = schema.items as JsonSchema;
  return (
    schema.type === 'array' &&
    items?.type === 'object' &&
    items.properties?.url?.type === 'string'
  );
};

export const urlArrayEntry: JsonFormsRendererRegistryEntry = {
  renderer: UrlArrayField,
  tester: rankWith(4, and(isControl, schemaMatches(isUrlArray))),
}; 