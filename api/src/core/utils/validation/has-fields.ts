import { type LooseObject } from '@app/core/types/index.js';

/**
 * Check if object has fields.
 * @param obj Object to check fields on
 * @param fields Fields to check
 */
export const hasFields = (object: LooseObject, fields: string[]) => {
    const keys = Object.keys(object);
    return keys.length >= 1 ? fields.filter((field) => !keys.includes(field)) : fields;
};
