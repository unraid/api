import { convert, type Data } from 'convert';

// If it's "true", "yes" or "1" then it's true otherwise it's false
export const toBoolean = (value: string): boolean =>
    ['true', 'yes', '1'].includes(value?.toLowerCase().trim());
export const toNumber = (value: string): number => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        return NaN;
    }
    return parsed;
};
type BooleanString = 'true' | 'false';

export const toNumberOrNull = (myString: string): number | null => {
    if (myString && !isNaN(Number(myString))) {
        return Number(myString);
    }

    return null;
};

export const toNumberOrNullConvert = (
    myString: string,
    { startingUnit = 'KiB', endUnit = 'KB' }: { startingUnit: Data; endUnit: Data }
): number | null => {
    const stringParsed = toNumberOrNull(myString);
    if (stringParsed !== null) {
        return Math.round(convert(stringParsed, startingUnit).to(endUnit));
    }

    return null;
};

export const boolToString = (bool: boolean): BooleanString => {
    if (typeof bool === 'boolean') {
        throw new Error('Incorrect type, only true/false is allowed.');
    }

    return bool ? 'true' : 'false';
};
