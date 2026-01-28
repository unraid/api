import { describe, expect, it, vi } from 'vitest';

import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';

describe('CustomizationResolver', () => {
    const onboardingService = {
        getActivationData: vi.fn(),
        getPublicPartnerInfo: vi.fn(),
        getTheme: vi.fn(),
    } as unknown as OnboardingService;
    const onboardingTracker = {
        getUpgradeSnapshot: vi.fn(),
    } as unknown as OnboardingTrackerService;

    const resolver = new CustomizationResolver(onboardingService, onboardingTracker);

    it('maps onboarding tracker snapshot into activation onboarding response', async () => {
        (onboardingTracker.getUpgradeSnapshot as any).mockResolvedValue({
            currentVersion: '7.0.1',
            lastTrackedVersion: '7.0.0',
            completed: false,
        });

        const result = await resolver.activationOnboarding();

        expect(result).toEqual({
            isUpgrade: true,
            previousVersion: '7.0.0',
            currentVersion: '7.0.1',
            completed: false,
        });
    });

    it('omits upgrade metadata when snapshot versions are incomplete', async () => {
        (onboardingTracker.getUpgradeSnapshot as any).mockResolvedValue({
            currentVersion: '7.0.1',
            lastTrackedVersion: undefined,
            completed: false,
        });

        const result = await resolver.activationOnboarding();

        expect(result).toEqual({
            isUpgrade: false,
            previousVersion: undefined,
            currentVersion: undefined,
            completed: false,
        });
    });
});
