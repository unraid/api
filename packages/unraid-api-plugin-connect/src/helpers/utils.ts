import { accessSync } from 'fs';
import { access } from 'fs/promises';
import { F_OK } from 'node:constants';

import type { Get } from 'type-fest';

export const fileExists = async (path: string) =>
    access(path, F_OK)
        .then(() => true)
        .catch(() => false);
export const fileExistsSync = (path: string) => {
    try {
        accessSync(path, F_OK);
        return true;
    } catch (error: unknown) {
        return false;
    }
};

/**
 * Converts a Comma Separated (CSV) string to an array of strings.
 *
 * @example
 * csvStringToArray('one,two,three') // ['one', 'two', 'three']
 * csvStringToArray('one, two, three') // ['one', 'two', 'three']
 * csvStringToArray(null) // []
 * csvStringToArray(undefined) // []
 * csvStringToArray('') // []
 *
 * @param csvString - The Comma Separated string to convert
 * @param opts - Options
 * @param opts.noEmpty - Whether to omit empty strings. Default is true.
 * @returns An array of strings
 */
export function csvStringToArray(
    csvString?: string | null,
    opts: { noEmpty?: boolean } = { noEmpty: true }
): string[] {
    if (!csvString) return [];
    const result = csvString.split(',').map((item) => item.trim());
    if (opts.noEmpty) {
        return result.filter((item) => item !== '');
    }
    return result;
}

/**
 * Retrieves a nested value from an object using a dot notation path.
 *
 * @example
 * const obj = { a: { b: { c: 'value' } } };
 * getNestedValue(obj, 'a.b.c') // 'value'
 * getNestedValue(obj, 'a.b') // { c: 'value' }
 * getNestedValue(obj, 'a.b.d') // undefined
 *
 * @param obj - The object to retrieve the value from
 * @param path - The dot notation path to the value
 * @returns The nested value or undefined if the path is invalid
 */
export function getNestedValue<TObj extends object, TPath extends string>(
    obj: TObj,
    path: TPath
): Get<TObj, TPath> {
    return path.split('.').reduce((acc, part) => acc?.[part], obj as any) as Get<TObj, TPath>;
}
