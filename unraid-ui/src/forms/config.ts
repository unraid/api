import { createAjv } from '@jsonforms/core';
import type Ajv from 'ajv';

export interface JsonFormsConfig {
  restrict: boolean;
  trim: boolean;
  ajv?: Ajv;
}

/**
 * Creates and configures an AJV instance for JSONForms rule evaluation
 * This ensures all JSONForms instances have proper validation and visibility rule support
 */
export function createJsonFormsAjv(): Ajv {
  return createAjv({
    allErrors: true,
    verbose: true,
    strict: false,
  });
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
