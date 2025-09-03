export function isValidEnumValue<T extends Record<string, string | number>>(
    value: unknown,
    enumObject: T
): value is T[keyof T] {
    if (value == null) {
        return false;
    }

    return Object.values(enumObject).includes(value as T[keyof T]);
}

export function validateEnumValue<T extends Record<string, string | number>>(
    value: unknown,
    enumObject: T
): T[keyof T] | undefined {
    return isValidEnumValue(value, enumObject) ? (value as T[keyof T]) : undefined;
}
