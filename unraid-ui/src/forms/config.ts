import { createAjv } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';

// Define types to avoid TypeScript inference issues
export interface JsonFormsAjv {
  validate: (schema: unknown, data: unknown) => boolean;
  errors?: ErrorObject[] | null;
}

export interface JsonFormsConfig {
  restrict: boolean;
  trim: boolean;
  ajv?: JsonFormsAjv;
}

/**
 * Creates and configures an AJV instance for JSONForms rule evaluation
 * This ensures all JSONForms instances have proper validation and visibility rule support
 */
export function createJsonFormsAjv(): JsonFormsAjv {
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
export const jsonFormsAjv: JsonFormsAjv = createJsonFormsAjv();

/**
 * Default JSONForms configuration with AJV instance
 */
export const defaultJsonFormsConfig: JsonFormsConfig = {
  restrict: false,
  trim: false,
  ajv: jsonFormsAjv,
};
