import { describe, expect, it } from 'vitest';

import { FormatService } from '@app/unraid-api/utils/format.service.js';

describe('FormatService', () => {
    const service = new FormatService();

    describe('formatBytes', () => {
        it('should format zero bytes', () => {
            expect(service.formatBytes(0)).toBe('0 B');
        });

        it('should format bytes to best unit', () => {
            expect(service.formatBytes(1024)).toBe('1.02 KB');
            expect(service.formatBytes(1048576)).toBe('1.05 MB');
            expect(service.formatBytes(1073741824)).toBe('1.07 GB');
        });

        it('should format with decimals when needed', () => {
            expect(service.formatBytes(1536)).toBe('1.54 KB');
            expect(service.formatBytes(9636529)).toBe('9.64 MB');
        });
    });

    describe('formatSpeed', () => {
        it('should format zero speed', () => {
            expect(service.formatSpeed(0)).toBe('0 B/s');
        });

        it('should format speed with /s suffix', () => {
            expect(service.formatSpeed(1024)).toBe('1.02 KB/s');
            expect(service.formatSpeed(1048576)).toBe('1.05 MB/s');
            expect(service.formatSpeed(1073741824)).toBe('1.07 GB/s');
        });

        it('should format with decimals when needed', () => {
            expect(service.formatSpeed(1536)).toBe('1.54 KB/s');
            expect(service.formatSpeed(9636529.183648435)).toBe('9.64 MB/s');
        });
    });

    describe('formatDuration', () => {
        it('should format small durations in seconds', () => {
            expect(service.formatDuration(30)).toBe('30s');
            expect(service.formatDuration(45.5)).toBe('45.5s');
        });

        it('should format longer durations to best unit', () => {
            expect(service.formatDuration(60)).toBe('60 s');
            expect(service.formatDuration(3600)).toBe('60 min');
            expect(service.formatDuration(86400)).toBe('24 h');
        });

        it('should format with decimals when needed', () => {
            expect(service.formatDuration(90)).toBe('1.5 min');
            expect(service.formatDuration(11.615060290966666 * 60)).toBe('11.62 min');
        });
    });
});
