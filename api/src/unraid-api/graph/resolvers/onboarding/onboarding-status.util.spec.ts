import { describe, expect, it } from 'vitest';

import {
    getOnboardingVersionDirection,
    hasOnboardingVersionDrift,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding-status.util.js';

describe('onboarding-status util', () => {
    describe('hasOnboardingVersionDrift', () => {
        it('returns true for minor-version upgrades', () => {
            expect(hasOnboardingVersionDrift('7.2.4', '7.3.0')).toBe(true);
        });

        it('returns false for patch updates within the same minor version', () => {
            expect(hasOnboardingVersionDrift('7.3.0', '7.3.1')).toBe(false);
        });

        it('returns true for prerelease minor-version upgrades', () => {
            expect(hasOnboardingVersionDrift('7.2.4', '7.3.0-beta.1')).toBe(true);
        });
    });

    describe('getOnboardingVersionDirection', () => {
        it('returns UPGRADE for minor-version upgrades', () => {
            expect(getOnboardingVersionDirection('7.2.4', '7.3.0')).toBe('UPGRADE');
        });

        it('returns undefined for patch updates within the same minor version', () => {
            expect(getOnboardingVersionDirection('7.3.0', '7.3.1')).toBeUndefined();
        });

        it('returns UPGRADE for prerelease minor-version upgrades', () => {
            expect(getOnboardingVersionDirection('7.2.4', '7.3.0-beta.1')).toBe('UPGRADE');
        });

        it('returns DOWNGRADE for minor-version downgrades', () => {
            expect(getOnboardingVersionDirection('7.3.0', '7.2.4')).toBe('DOWNGRADE');
        });
    });
});
