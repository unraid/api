import { describe, expect, test } from 'vitest';

import {
    iniBooleanOrAutoToJsBoolean,
    iniBooleanToJsBoolean,
} from '@app/core/utils/parsers/ini-boolean-parser.js';

describe('iniBooleanToJsBoolean', () => {
    describe('valid boolean values', () => {
        test('returns false for "no"', () => {
            expect(iniBooleanToJsBoolean('no')).toBe(false);
        });

        test('returns false for "false"', () => {
            expect(iniBooleanToJsBoolean('false')).toBe(false);
        });

        test('returns true for "yes"', () => {
            expect(iniBooleanToJsBoolean('yes')).toBe(true);
        });

        test('returns true for "true"', () => {
            expect(iniBooleanToJsBoolean('true')).toBe(true);
        });
    });

    describe('malformed values', () => {
        test('handles "no*" as false', () => {
            expect(iniBooleanToJsBoolean('no*')).toBe(false);
        });

        test('handles "yes*" as true', () => {
            expect(iniBooleanToJsBoolean('yes*')).toBe(true);
        });

        test('handles "true*" as true', () => {
            expect(iniBooleanToJsBoolean('true*')).toBe(true);
        });

        test('handles "false*" as false', () => {
            expect(iniBooleanToJsBoolean('false*')).toBe(false);
        });

        test('returns undefined for "n0!" (cleans to "n" which is invalid)', () => {
            expect(iniBooleanToJsBoolean('n0!')).toBe(undefined);
        });

        test('returns undefined for "y3s!" (cleans to "ys" which is invalid)', () => {
            expect(iniBooleanToJsBoolean('y3s!')).toBe(undefined);
        });

        test('handles mixed case with extra chars "YES*" as true', () => {
            expect(iniBooleanToJsBoolean('YES*')).toBe(true);
        });

        test('handles mixed case with extra chars "NO*" as false', () => {
            expect(iniBooleanToJsBoolean('NO*')).toBe(false);
        });
    });

    describe('default values', () => {
        test('returns default value for invalid input when provided', () => {
            expect(iniBooleanToJsBoolean('invalid', true)).toBe(true);
            expect(iniBooleanToJsBoolean('invalid', false)).toBe(false);
        });

        test('returns default value for empty string when provided', () => {
            expect(iniBooleanToJsBoolean('', true)).toBe(true);
            expect(iniBooleanToJsBoolean('', false)).toBe(false);
        });
    });

    describe('undefined fallback cases', () => {
        test('returns undefined for invalid input without default', () => {
            expect(iniBooleanToJsBoolean('invalid')).toBe(undefined);
        });

        test('returns undefined for empty string without default', () => {
            expect(iniBooleanToJsBoolean('')).toBe(undefined);
        });

        test('returns undefined for numeric string without default', () => {
            expect(iniBooleanToJsBoolean('123')).toBe(undefined);
        });
    });
});

describe('iniBooleanOrAutoToJsBoolean', () => {
    describe('valid boolean values', () => {
        test('returns false for "no"', () => {
            expect(iniBooleanOrAutoToJsBoolean('no')).toBe(false);
        });

        test('returns false for "false"', () => {
            expect(iniBooleanOrAutoToJsBoolean('false')).toBe(false);
        });

        test('returns true for "yes"', () => {
            expect(iniBooleanOrAutoToJsBoolean('yes')).toBe(true);
        });

        test('returns true for "true"', () => {
            expect(iniBooleanOrAutoToJsBoolean('true')).toBe(true);
        });
    });

    describe('auto value', () => {
        test('returns null for "auto"', () => {
            expect(iniBooleanOrAutoToJsBoolean('auto')).toBe(null);
        });
    });

    describe('malformed values', () => {
        test('handles "no*" as false', () => {
            expect(iniBooleanOrAutoToJsBoolean('no*')).toBe(false);
        });

        test('handles "yes*" as true', () => {
            expect(iniBooleanOrAutoToJsBoolean('yes*')).toBe(true);
        });

        test('handles "auto*" as null', () => {
            expect(iniBooleanOrAutoToJsBoolean('auto*')).toBe(null);
        });

        test('handles "true*" as true', () => {
            expect(iniBooleanOrAutoToJsBoolean('true*')).toBe(true);
        });

        test('handles "false*" as false', () => {
            expect(iniBooleanOrAutoToJsBoolean('false*')).toBe(false);
        });

        test('handles "n0!" as undefined fallback (cleans to "n" which is invalid)', () => {
            expect(iniBooleanOrAutoToJsBoolean('n0!')).toBe(undefined);
        });

        test('handles "a1ut2o!" as null (removes non-alphabetic chars)', () => {
            expect(iniBooleanOrAutoToJsBoolean('a1ut2o!')).toBe(null);
        });

        test('handles mixed case "AUTO*" as null', () => {
            expect(iniBooleanOrAutoToJsBoolean('AUTO*')).toBe(null);
        });
    });

    describe('fallback behavior', () => {
        test('returns undefined for completely invalid input', () => {
            expect(iniBooleanOrAutoToJsBoolean('invalid123')).toBe(undefined);
        });

        test('returns undefined for empty string', () => {
            expect(iniBooleanOrAutoToJsBoolean('')).toBe(undefined);
        });

        test('returns undefined for numeric string', () => {
            expect(iniBooleanOrAutoToJsBoolean('123')).toBe(undefined);
        });

        test('returns undefined for special characters only', () => {
            expect(iniBooleanOrAutoToJsBoolean('!@#$')).toBe(undefined);
        });
    });

    describe('edge cases', () => {
        test('handles undefined gracefully', () => {
            expect(iniBooleanOrAutoToJsBoolean(undefined as any)).toBe(undefined);
        });

        test('handles null gracefully', () => {
            expect(iniBooleanOrAutoToJsBoolean(null as any)).toBe(undefined);
        });

        test('handles non-string input gracefully', () => {
            expect(iniBooleanOrAutoToJsBoolean(123 as any)).toBe(undefined);
        });
    });
});
