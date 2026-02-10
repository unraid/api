import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingStatus } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingMutationsResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.mutation.js';

describe('OnboardingMutationsResolver', () => {
    const onboardingTracker = {
        markCompleted: vi.fn(),
        reset: vi.fn(),
        getState: vi.fn(),
        getCurrentVersion: vi.fn(),
    };

    const onboardingOverrides = {
        setState: vi.fn(),
        clearState: vi.fn(),
    };

    const onboardingService = {
        getPublicPartnerInfo: vi.fn(),
        clearActivationDataCache: vi.fn(),
    };

    let resolver: OnboardingMutationsResolver;

    beforeEach(() => {
        vi.clearAllMocks();
        resolver = new OnboardingMutationsResolver(
            onboardingTracker as any,
            onboardingOverrides as any,
            onboardingService as any
        );
    });

    it('propagates tracker failure from completeOnboarding', async () => {
        const error = new Error('tracker-write-failed');
        onboardingTracker.markCompleted.mockRejectedValue(error);

        await expect(resolver.completeOnboarding()).rejects.toThrow('tracker-write-failed');
        expect(onboardingService.getPublicPartnerInfo).not.toHaveBeenCalled();
    });

    it('returns completed onboarding state when markCompleted succeeds', async () => {
        onboardingTracker.markCompleted.mockResolvedValue({
            completed: true,
            completedAtVersion: '7.2.0',
        });
        onboardingTracker.getState.mockReturnValue({
            completed: true,
            completedAtVersion: '7.2.0',
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.0');
        onboardingService.getPublicPartnerInfo.mockResolvedValue(null);

        const result = await resolver.completeOnboarding();

        expect(result.completed).toBe(true);
        expect(result.completedAtVersion).toBe('7.2.0');
        expect(result.status).toBe(OnboardingStatus.COMPLETED);
        expect(result.isPartnerBuild).toBe(false);
    });
});
