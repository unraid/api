import { describe, expect, it, vi } from 'vitest';

import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
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
    } as unknown as OnboardingTracker;

    const resolver = new CustomizationResolver(onboardingService, onboardingTracker);

    it('maps onboarding tracker snapshot into activation onboarding response', async () => {
        (onboardingTracker.getUpgradeSnapshot as any).mockResolvedValue({
            currentVersion: '7.0.1',
            lastTrackedVersion: '7.0.0',
            completedSteps: ['TIMEZONE'],
            steps: [
                {
                    id: ActivationOnboardingStepId.TIMEZONE,
                    required: true,
                    introducedIn: '7.0.0',
                },
                {
                    id: ActivationOnboardingStepId.ACTIVATION,
                    required: true,
                    introducedIn: '7.0.0',
                },
            ],
        });

        const result = await resolver.activationOnboarding();

        expect(result).toEqual({
            isUpgrade: true,
            previousVersion: '7.0.0',
            currentVersion: '7.0.1',
            hasPendingSteps: true,
            steps: [
                {
                    id: ActivationOnboardingStepId.TIMEZONE,
                    required: true,
                    introducedIn: '7.0.0',
                    completed: true,
                },
                {
                    id: ActivationOnboardingStepId.ACTIVATION,
                    required: true,
                    introducedIn: '7.0.0',
                    completed: false,
                },
            ],
        });
    });
});
