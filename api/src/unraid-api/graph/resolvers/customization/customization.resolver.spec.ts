import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { OnboardingStatus } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';

describe('CustomizationResolver', () => {
    const onboardingService = {
        getActivationData: vi.fn(),
        getPublicPartnerInfo: vi.fn(),
        getTheme: vi.fn(),
        isFreshInstall: vi.fn(),
        getOnboardingState: vi.fn(),
    } as unknown as OnboardingService;
    const onboardingTracker = {
        getState: vi.fn(),
        getCurrentVersion: vi.fn(),
    } as unknown as OnboardingTrackerService;

    const resolver = new CustomizationResolver(onboardingService, onboardingTracker);

    beforeEach(() => {
        vi.clearAllMocks();
        (onboardingTracker.getCurrentVersion as any).mockReturnValue('7.2.0');
        (onboardingService.getPublicPartnerInfo as any).mockResolvedValue(null);
    });

    it('returns INCOMPLETE status when not completed', async () => {
        (onboardingTracker.getState as any).mockReturnValue({
            completed: false,
            completedAtVersion: undefined,
        });

        const result = await resolver.onboarding();

        expect(result).toEqual({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: false,
            completed: false,
            completedAtVersion: undefined,
        });
    });

    it('returns COMPLETED status when completed on current version', async () => {
        (onboardingTracker.getState as any).mockReturnValue({
            completed: true,
            completedAtVersion: '7.2.0',
        });

        const result = await resolver.onboarding();

        expect(result).toEqual({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.0',
        });
    });

    it('returns UPGRADE status when completed on older version', async () => {
        (onboardingTracker.getState as any).mockReturnValue({
            completed: true,
            completedAtVersion: '7.1.0',
        });

        const result = await resolver.onboarding();

        expect(result).toEqual({
            status: OnboardingStatus.UPGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.1.0',
        });
    });

    it('returns isPartnerBuild true when partner info exists', async () => {
        (onboardingTracker.getState as any).mockReturnValue({
            completed: false,
            completedAtVersion: undefined,
        });
        (onboardingService.getPublicPartnerInfo as any).mockResolvedValue({
            partnerName: 'Test Partner',
        });

        const result = await resolver.onboarding();

        expect(result.isPartnerBuild).toBe(true);
        expect(result.status).toBe(OnboardingStatus.INCOMPLETE);
    });
});
