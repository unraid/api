import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import type { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import type { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import type { OnboardingOverrideInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { OnboardingStatus } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CreateInternalBootPoolInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { OnboardingMutationsResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.mutation.js';

describe('OnboardingMutationsResolver', () => {
    const onboardingOverrides = {
        setState: vi.fn(),
        clearState: vi.fn(),
    } satisfies Pick<OnboardingOverrideService, 'setState' | 'clearState'>;

    const onboardingService = {
        markOnboardingCompleted: vi.fn(),
        resetOnboarding: vi.fn(),
        getOnboardingResponse: vi.fn(),
        clearActivationDataCache: vi.fn(),
    } satisfies Pick<
        OnboardingService,
        | 'markOnboardingCompleted'
        | 'resetOnboarding'
        | 'getOnboardingResponse'
        | 'clearActivationDataCache'
    >;

    const onboardingInternalBootService = {
        createInternalBootPool: vi.fn(),
    } satisfies Pick<OnboardingInternalBootService, 'createInternalBootPool'>;

    const defaultOnboardingResponse = {
        status: OnboardingStatus.INCOMPLETE,
        isPartnerBuild: false,
        completed: false,
        completedAtVersion: undefined,
        onboardingState: {
            registrationState: null,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        },
    };

    let resolver: OnboardingMutationsResolver;

    const createResolver = () =>
        new OnboardingMutationsResolver(
            onboardingOverrides as unknown as OnboardingOverrideService,
            onboardingService as unknown as OnboardingService,
            onboardingInternalBootService as unknown as OnboardingInternalBootService
        );

    beforeEach(() => {
        vi.clearAllMocks();
        onboardingService.markOnboardingCompleted.mockResolvedValue(undefined);
        onboardingService.resetOnboarding.mockResolvedValue(undefined);
        onboardingService.getOnboardingResponse.mockResolvedValue(defaultOnboardingResponse);

        resolver = createResolver();
    });

    it('propagates completion failures', async () => {
        const error = new Error('tracker-write-failed');
        onboardingService.markOnboardingCompleted.mockRejectedValue(error);

        await expect(resolver.completeOnboarding()).rejects.toThrow('tracker-write-failed');
        expect(onboardingService.getOnboardingResponse).not.toHaveBeenCalled();
    });

    it('delegates completeOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            status: OnboardingStatus.COMPLETED,
            completed: true,
            completedAtVersion: '7.2.0',
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.completeOnboarding()).resolves.toEqual(response);
        expect(onboardingService.markOnboardingCompleted).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('delegates resetOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            status: OnboardingStatus.INCOMPLETE,
            completed: false,
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.resetOnboarding()).resolves.toEqual(response);
        expect(onboardingService.resetOnboarding).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('stores overrides, clears activation cache, and returns the shared onboarding response', async () => {
        const response = {
            ...defaultOnboardingResponse,
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: true,
            completed: true,
            completedAtVersion: '7.2.0',
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        const input: OnboardingOverrideInput = {
            onboarding: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
            registrationState: undefined,
        };

        await expect(resolver.setOnboardingOverride(input)).resolves.toEqual(response);
        expect(onboardingOverrides.setState).toHaveBeenCalledWith({
            onboarding: input.onboarding,
            activationCode: undefined,
            partnerInfo: undefined,
            registrationState: undefined,
        });
        expect(onboardingService.clearActivationDataCache).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('clears overrides and returns the shared onboarding response', async () => {
        await expect(resolver.clearOnboardingOverride()).resolves.toEqual(defaultOnboardingResponse);
        expect(onboardingOverrides.clearState).toHaveBeenCalledTimes(1);
        expect(onboardingService.clearActivationDataCache).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('propagates onboarding response failures after completion', async () => {
        onboardingService.getOnboardingResponse.mockRejectedValue(new Error('tracker-read-failed'));

        await expect(resolver.completeOnboarding()).rejects.toThrow('tracker-read-failed');
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

        await expect(resolver.createInternalBootPool(input)).resolves.toEqual({
            ok: true,
            code: 0,
            output: 'done',
        });
        expect(onboardingInternalBootService.createInternalBootPool).toHaveBeenCalledWith(input);
    });
});
