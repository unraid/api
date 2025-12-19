import { eq, gt, gte, lt, lte, parse } from 'semver';
import { describe, expect, it } from 'vitest';

import { compareVersions } from '@app/common/compare-semver-version.js';

describe('compareVersions', () => {
    describe('basic comparisons', () => {
        it('should return true when current version is greater than compared (gte)', () => {
            const current = parse('7.3.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should return true when current version equals compared (gte)', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should return false when current version is less than compared (gte)', () => {
            const current = parse('7.1.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(false);
        });

        it('should return true when current version is less than compared (lte)', () => {
            const current = parse('7.1.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lte)).toBe(true);
        });

        it('should return true when current version equals compared (lte)', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lte)).toBe(true);
        });

        it('should return false when current version is greater than compared (lte)', () => {
            const current = parse('7.3.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lte)).toBe(false);
        });

        it('should return true when current version is greater than compared (gt)', () => {
            const current = parse('7.3.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gt)).toBe(true);
        });

        it('should return false when current version equals compared (gt)', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gt)).toBe(false);
        });

        it('should return true when current version is less than compared (lt)', () => {
            const current = parse('7.1.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lt)).toBe(true);
        });

        it('should return false when current version equals compared (lt)', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lt)).toBe(false);
        });

        it('should return true when versions are equal (eq)', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, eq)).toBe(true);
        });

        it('should return false when versions are not equal (eq)', () => {
            const current = parse('7.3.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, eq)).toBe(false);
        });
    });

    describe('prerelease handling - current has prerelease, compared is stable', () => {
        it('should return true for gte when current prerelease > stable (same base)', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should return true for gt when current prerelease > stable (same base)', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gt)).toBe(true);
        });

        it('should return false for lte when current prerelease < stable (same base)', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lte)).toBe(false);
        });

        it('should return false for lt when current prerelease < stable (same base)', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, lt)).toBe(false);
        });

        it('should return false for eq when current prerelease != stable (same base)', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, eq)).toBe(false);
        });
    });

    describe('prerelease handling - current is stable, compared has prerelease', () => {
        it('should use normal comparison when current is stable and compared has prerelease', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0-beta.1')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should use normal comparison for lte when current is stable and compared has prerelease', () => {
            const current = parse('7.2.0')!;
            const compared = parse('7.2.0-beta.1')!;
            expect(compareVersions(current, compared, lte)).toBe(false);
        });
    });

    describe('prerelease handling - both have prerelease', () => {
        it('should use normal comparison when both versions have prerelease', () => {
            const current = parse('7.2.0-beta.2')!;
            const compared = parse('7.2.0-beta.1')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should use normal comparison for lte when both have prerelease', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0-beta.2')!;
            expect(compareVersions(current, compared, lte)).toBe(true);
        });

        it('should use normal comparison when prerelease versions are equal', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0-beta.1')!;
            expect(compareVersions(current, compared, eq)).toBe(true);
        });
    });

    describe('prerelease handling - different base versions', () => {
        it('should use normal comparison when base versions differ (current prerelease)', () => {
            const current = parse('7.3.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should use normal comparison when base versions differ (current prerelease, less)', () => {
            const current = parse('7.1.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(false);
        });
    });

    describe('includePrerelease flag', () => {
        it('should apply special prerelease handling when includePrerelease is true', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte, { includePrerelease: true })).toBe(true);
        });

        it('should skip special prerelease handling when includePrerelease is false', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte, { includePrerelease: false })).toBe(false);
        });

        it('should default to includePrerelease true', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle patch version differences', () => {
            const current = parse('7.2.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should handle minor version differences', () => {
            const current = parse('7.3.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should handle major version differences', () => {
            const current = parse('8.0.0')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should handle complex prerelease tags', () => {
            const current = parse('7.2.0-beta.2.4')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should handle alpha prerelease tags', () => {
            const current = parse('7.2.0-alpha.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });

        it('should handle rc prerelease tags', () => {
            const current = parse('7.2.0-rc.1')!;
            const compared = parse('7.2.0')!;
            expect(compareVersions(current, compared, gte)).toBe(true);
        });
    });

    describe('comparison function edge cases', () => {
        it('should handle custom comparison functions that are not gte/lte/gt/lt', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            const customCompare = (a: typeof current, b: typeof compared) => a.compare(b) === 1;
            expect(compareVersions(current, compared, customCompare)).toBe(false);
        });

        it('should fall through to normal comparison for unknown functions with prerelease', () => {
            const current = parse('7.2.0-beta.1')!;
            const compared = parse('7.2.0')!;
            const customCompare = () => false;
            expect(compareVersions(current, compared, customCompare)).toBe(false);
        });
    });
});
