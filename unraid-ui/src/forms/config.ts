import { createAjv } from '@jsonforms/core';
import type { Ajv } from 'ajv';
import addErrors from 'ajv-errors';

export interface JsonFormsConfig {
  /**
   * When true, only properties defined in the schema will be rendered.
   * Extra properties not in the schema are omitted from the form.
   */
  restrict: boolean;
  /**
   * When true, leading and trailing whitespace is removed from string inputs
   * before validation.
   */
  trim: boolean;
  ajv?: Ajv;
}

/**
 * Creates and configures an AJV instance for JSONForms rule evaluation
 * This ensures all JSONForms instances have proper validation and visibility rule support
 */
export function createJsonFormsAjv(): Ajv {
  const ajv = createAjv({
    allErrors: true,
    strict: false,
  });

  // Add support for custom error messages
  addErrors(ajv);

  return ajv;
}

/**
 * Shared AJV instance for all JSONForms components
 * This enables proper rule evaluation for visibility conditions
 */
export const jsonFormsAjv: Ajv = createJsonFormsAjv();

/**
 * Default JSONForms configuration with AJV instance
 */
export const defaultJsonFormsConfig: JsonFormsConfig = {
  restrict: false,
  trim: false,
  ajv: jsonFormsAjv,
};
