import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingStatus } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CreateInternalBootPoolInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { OnboardingMutationsResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.mutation.js';

describe('OnboardingMutationsResolver', () => {
    const onboardingTracker = {
        markCompleted: vi.fn(),
        reset: vi.fn(),
        getStateResult: vi.fn(),
        getCurrentVersion: vi.fn(),
    };

    const onboardingOverrides = {
        setState: vi.fn(),
        clearState: vi.fn(),
    };

    const onboardingService = {
        getPublicPartnerInfo: vi.fn(),
        getOnboardingState: vi.fn(),
        clearActivationDataCache: vi.fn(),
    };

    const onboardingInternalBootService = {
        createInternalBootPool: vi.fn(),
    };

    let resolver: OnboardingMutationsResolver;

    beforeEach(() => {
        vi.clearAllMocks();
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: false,
                completedAtVersion: undefined,
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.0');
        onboardingService.getPublicPartnerInfo.mockResolvedValue(null);
        onboardingService.getOnboardingState.mockResolvedValue({
            registrationState: null,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        });

        resolver = new OnboardingMutationsResolver(
            onboardingTracker as any,
            onboardingOverrides as any,
            onboardingService as any,
            onboardingInternalBootService as any
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
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.0');
        onboardingService.getPublicPartnerInfo.mockResolvedValue(null);

        const result = await resolver.completeOnboarding();

        expect(result.completed).toBe(true);
        expect(result.completedAtVersion).toBe('7.2.0');
        expect(result.status).toBe(OnboardingStatus.COMPLETED);
        expect(result.isPartnerBuild).toBe(false);
        expect(result.onboardingState).toEqual({
            registrationState: null,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        });
    });

    it('returns incomplete status after resetOnboarding', async () => {
        onboardingTracker.reset.mockResolvedValue(undefined);
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: false,
                completedAtVersion: undefined,
            },
        });

        const result = await resolver.resetOnboarding();

        expect(onboardingTracker.reset).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(OnboardingStatus.INCOMPLETE);
        expect(result.completed).toBe(false);
    });

    it('returns completed status when completed version is on a prior patch of current minor', async () => {
        onboardingTracker.markCompleted.mockResolvedValue(undefined);
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.2.1',
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.4');

        const result = await resolver.completeOnboarding();

        expect(result.status).toBe(OnboardingStatus.COMPLETED);
    });

    it('returns upgrade status when completed version is behind current', async () => {
        onboardingTracker.markCompleted.mockResolvedValue(undefined);
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.1.0',
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.0');

        const result = await resolver.completeOnboarding();

        expect(result.status).toBe(OnboardingStatus.UPGRADE);
    });

    it('returns downgrade status when completed version is ahead of current', async () => {
        onboardingTracker.markCompleted.mockResolvedValue(undefined);
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.1.0');

        const result = await resolver.completeOnboarding();

        expect(result.status).toBe(OnboardingStatus.DOWNGRADE);
    });

    it('setOnboardingOverride stores override, clears cache, and returns onboarding state', async () => {
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
        });
        onboardingTracker.getCurrentVersion.mockReturnValue('7.2.0');
        onboardingService.getPublicPartnerInfo.mockResolvedValue({
            partner: { name: 'Partner' },
            branding: {},
        } as any);

        const input = {
            onboarding: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
            registrationState: undefined,
        } as any;

        const result = await resolver.setOnboardingOverride(input);

        expect(onboardingOverrides.setState).toHaveBeenCalledWith({
            onboarding: input.onboarding,
            activationCode: undefined,
            partnerInfo: undefined,
            registrationState: undefined,
        });
        expect(onboardingService.clearActivationDataCache).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(OnboardingStatus.COMPLETED);
        expect(result.isPartnerBuild).toBe(true);
    });

    it('clearOnboardingOverride clears override and cache', async () => {
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: false,
                completedAtVersion: undefined,
            },
        });

        const result = await resolver.clearOnboardingOverride();

        expect(onboardingOverrides.clearState).toHaveBeenCalledTimes(1);
        expect(onboardingService.clearActivationDataCache).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(OnboardingStatus.INCOMPLETE);
    });

    it('delegates createInternalBootPool to onboarding internal boot service', async () => {
        onboardingInternalBootService.createInternalBootPool.mockResolvedValue({
            ok: true,
            code: 0,
            output: 'done',
        });

        const input: CreateInternalBootPoolInput = {
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: true,
        };
        const result = await resolver.createInternalBootPool(input);

        expect(onboardingInternalBootService.createInternalBootPool).toHaveBeenCalledWith(input);
        expect(result).toEqual({
            ok: true,
            code: 0,
            output: 'done',
        });
    });

    it('propagates tracker read failures while building the completion response', async () => {
        onboardingTracker.markCompleted.mockResolvedValue(undefined);
        onboardingTracker.getStateResult.mockResolvedValue({
            kind: 'error',
            error: new Error('tracker-read-failed'),
        });

        await expect(resolver.completeOnboarding()).rejects.toThrow('tracker-read-failed');
    });
});
