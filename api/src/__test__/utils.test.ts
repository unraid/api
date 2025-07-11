import { describe, expect, it } from 'vitest';

import { csvStringToArray, formatDatetime, parsePackageArg } from '@app/utils.js';

describe('formatDatetime', () => {
    const testDate = new Date('2024-02-14T12:34:56');

    it('formats with default system time format and omits timezone', () => {
        const result = formatDatetime(testDate);
        // Default format is %c with timezone omitted
        expect(result).toMatch('Wed 14 Feb 2024 12:34:56 PM');
    });

    it('includes timezone when omitTimezone is false', () => {
        const result = formatDatetime(testDate, { omitTimezone: false });
        // Should include timezone at the end
        expect(result).toMatch(/^Wed 14 Feb 2024 12:34:56 PM .+$/);
    });

    it('formats with custom date and time formats', () => {
        const result = formatDatetime(testDate, {
            dateFormat: '%Y-%m-%d',
            timeFormat: '%H:%M',
        });
        expect(result).toBe('2024-02-14 12:34');
    });

    it('formats with custom date format and default time format', () => {
        const result = formatDatetime(testDate, {
            dateFormat: '%d/%m/%Y',
        });
        expect(result).toBe('14/02/2024 12:34 PM');
    });

    describe('Unraid-style date formats', () => {
        const dateFormats = [
            '%A, %Y %B %e', // Day, YYYY Month D
            '%A, %e %B %Y', // Day, D Month YYYY
            '%A, %B %e, %Y', // Day, Month D, YYYY
            '%A, %m/%d/%Y', // Day, MM/DD/YYYY
            '%A, %d-%m-%Y', // Day, DD-MM-YYYY
            '%A, %d.%m.%Y', // Day, DD.MM.YYYY
            '%A, %Y-%m-%d', // Day, YYYY-MM-DD
        ];

        const timeFormats = [
            '%I:%M %p', // 12 hours
            '%R', // 24 hours
        ];

        it.each(dateFormats)('formats date with %s', (dateFormat) => {
            const result = formatDatetime(testDate, { dateFormat });
            expect(result).toMatch(/^Wednesday.*2024.*12:34 PM$/);
        });

        it.each(timeFormats)('formats time with %s', (timeFormat) => {
            // specify a non-system-time date format for this test
            const result = formatDatetime(testDate, { timeFormat, dateFormat: dateFormats[1] });
            const expectedTime = timeFormat === '%R' ? '12:34' : '12:34 PM';
            expect(result).toContain(expectedTime);
        });

        it.each(dateFormats.flatMap((d) => timeFormats.map((t) => [d, t])))(
            'formats with date format %s and time format %s',
            (dateFormat, timeFormat) => {
                const result = formatDatetime(testDate, { dateFormat, timeFormat });
                expect(result).toMatch(/^Wednesday.*2024.*(?:12:34 PM|12:34)$/);
            }
        );
    });
});

describe('csvStringToArray', () => {
    it('returns an empty array for null, undefined, or empty strings', () => {
        expect(csvStringToArray(null)).toEqual([]);
        expect(csvStringToArray(undefined)).toEqual([]);
        expect(csvStringToArray('')).toEqual([]);
    });

    it('returns an array of strings for a CSV string', () => {
        expect(csvStringToArray('one,two,three')).toEqual(['one', 'two', 'three']);
    });

    it('returns an array of strings for a CSV string with spaces', () => {
        expect(csvStringToArray('one, two,  three')).toEqual(['one', 'two', 'three']);
    });

    it('handles single element edge cases', () => {
        expect(csvStringToArray('one', { noEmpty: false })).toEqual(['one']);
        expect(csvStringToArray('one,', { noEmpty: false })).toEqual(['one', '']);
        expect(csvStringToArray(',one', { noEmpty: false })).toEqual(['', 'one']);
        expect(csvStringToArray(',one,', { noEmpty: false })).toEqual(['', 'one', '']);
    });

    it('handles non-empty option', () => {
        expect(csvStringToArray('one', { noEmpty: true })).toEqual(['one']);
        expect(csvStringToArray('one,', { noEmpty: true })).toEqual(['one']);
        expect(csvStringToArray(',one', { noEmpty: true })).toEqual(['one']);
        expect(csvStringToArray(',one,', { noEmpty: true })).toEqual(['one']);
    });

    it('defaults to noEmpty', () => {
        expect(csvStringToArray(',one,')).toEqual(['one']);
    });
});

describe('parsePackageArg', () => {
    it('parses simple package names without version', () => {
        expect(parsePackageArg('lodash')).toEqual({ name: 'lodash' });
        expect(parsePackageArg('express')).toEqual({ name: 'express' });
        expect(parsePackageArg('react')).toEqual({ name: 'react' });
    });

    it('parses simple package names with version', () => {
        expect(parsePackageArg('lodash@4.17.21')).toEqual({ name: 'lodash', version: '4.17.21' });
        expect(parsePackageArg('express@4.18.2')).toEqual({ name: 'express', version: '4.18.2' });
        expect(parsePackageArg('react@18.2.0')).toEqual({ name: 'react', version: '18.2.0' });
    });

    it('parses scoped package names without version', () => {
        expect(parsePackageArg('@types/node')).toEqual({ name: '@types/node' });
        expect(parsePackageArg('@angular/core')).toEqual({ name: '@angular/core' });
        expect(parsePackageArg('@nestjs/common')).toEqual({ name: '@nestjs/common' });
    });

    it('parses scoped package names with version', () => {
        expect(parsePackageArg('@types/node@18.15.0')).toEqual({
            name: '@types/node',
            version: '18.15.0',
        });
        expect(parsePackageArg('@angular/core@15.2.0')).toEqual({
            name: '@angular/core',
            version: '15.2.0',
        });
        expect(parsePackageArg('@nestjs/common@9.3.12')).toEqual({
            name: '@nestjs/common',
            version: '9.3.12',
        });
    });

    it('handles version ranges and tags', () => {
        expect(parsePackageArg('lodash@^4.17.0')).toEqual({ name: 'lodash', version: '^4.17.0' });
        expect(parsePackageArg('react@~18.2.0')).toEqual({ name: 'react', version: '~18.2.0' });
        expect(parsePackageArg('express@latest')).toEqual({ name: 'express', version: 'latest' });
        expect(parsePackageArg('vue@beta')).toEqual({ name: 'vue', version: 'beta' });
        expect(parsePackageArg('@types/node@next')).toEqual({ name: '@types/node', version: 'next' });
    });

    it('handles multiple @ symbols correctly', () => {
        expect(parsePackageArg('package@1.0.0@extra')).toEqual({
            name: 'package@1.0.0',
            version: 'extra',
        });
        expect(parsePackageArg('@scope/pkg@1.0.0@extra')).toEqual({
            name: '@scope/pkg@1.0.0',
            version: 'extra',
        });
    });

    it('ignores versions that contain forward slashes', () => {
        expect(parsePackageArg('package@github:user/repo')).toEqual({
            name: 'package@github:user/repo',
        });
        expect(parsePackageArg('@scope/pkg@git+https://github.com/user/repo.git')).toEqual({
            name: '@scope/pkg@git+https://github.com/user/repo.git',
        });
    });

    it('handles edge cases', () => {
        expect(parsePackageArg('@')).toEqual({ name: '@' });
        expect(parsePackageArg('@scope')).toEqual({ name: '@scope' });
        expect(parsePackageArg('package@')).toEqual({ name: 'package@' });
        expect(parsePackageArg('@scope/pkg@')).toEqual({ name: '@scope/pkg@' });
    });

    it('handles empty version strings', () => {
        expect(parsePackageArg('package@')).toEqual({ name: 'package@' });
        expect(parsePackageArg('@scope/package@')).toEqual({ name: '@scope/package@' });
    });
});
