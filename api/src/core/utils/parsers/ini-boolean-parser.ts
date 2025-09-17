import { type IniStringBoolean, type IniStringBooleanOrAuto } from '@app/core/types/ini.js';

/**
 * Converts INI boolean string values to JavaScript boolean values.
 * Handles malformed values by cleaning them of non-alphabetic characters.
 *
 * @param value - The string value to parse ("yes", "no", "true", "false", etc.)
 * @returns boolean value or undefined if parsing fails
 */
export function iniBooleanToJsBoolean(value: string): boolean | undefined;
/**
 * Converts INI boolean string values to JavaScript boolean values.
 * Handles malformed values by cleaning them of non-alphabetic characters.
 *
 * @param value - The string value to parse ("yes", "no", "true", "false", etc.)
 * @param defaultValue - Default value to return if parsing fails
 * @returns boolean value or defaultValue if parsing fails (never undefined when defaultValue is provided)
 */
export function iniBooleanToJsBoolean(value: string, defaultValue: boolean): boolean;
export function iniBooleanToJsBoolean(value: string, defaultValue?: boolean): boolean | undefined {
    if (value === 'no' || value === 'false') {
        return false;
    }

    if (value === 'yes' || value === 'true') {
        return true;
    }

    // Handle malformed values by cleaning them first
    if (typeof value === 'string') {
        const cleanValue = value.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanValue === 'no' || cleanValue === 'false') {
            return false;
        }
        if (cleanValue === 'yes' || cleanValue === 'true') {
            return true;
        }
    }

    // Always return defaultValue when provided (even if undefined)
    if (arguments.length >= 2) {
        return defaultValue;
    }

    // Return undefined only when no default was provided
    return undefined;
}

/**
 * Converts INI boolean or auto string values to JavaScript boolean or null values.
 * Handles malformed values by cleaning them of non-alphabetic characters.
 *
 * @param value - The string value to parse ("yes", "no", "auto", "true", "false", etc.)
 * @returns boolean value for yes/no/true/false, null for auto, or undefined as fallback
 */
export const iniBooleanOrAutoToJsBoolean = (
    value: IniStringBooleanOrAuto | string
): boolean | null | undefined => {
    // Handle auto first
    if (value === 'auto') {
        return null;
    }

    // Try to parse as boolean
    const boolResult = iniBooleanToJsBoolean(value as IniStringBoolean);
    if (boolResult !== undefined) {
        return boolResult;
    }

    // Handle malformed values like "auto*" by extracting the base value
    if (typeof value === 'string') {
        const cleanValue = value.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanValue === 'auto') {
            return null;
        }
        if (cleanValue === 'no' || cleanValue === 'false') {
            return false;
        }
        if (cleanValue === 'yes' || cleanValue === 'true') {
            return true;
        }
    }

    // Return undefined as fallback instead of throwing to prevent API crash
    return undefined;
};
