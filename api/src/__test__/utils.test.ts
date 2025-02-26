import { describe, expect, it } from 'vitest';

import { formatDatetime } from '@app/utils.js';

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
