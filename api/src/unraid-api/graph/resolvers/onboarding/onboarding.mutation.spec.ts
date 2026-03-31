import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import type { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import type { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import type {
    OnboardingOverrideInput,
    SaveOnboardingDraftInput,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import {
    OnboardingStatus,
    OnboardingWizardStepId,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import {
    CloseOnboardingReason,
    CreateInternalBootPoolInput,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { OnboardingMutationsResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.mutation.js';

describe('OnboardingMutationsResolver', () => {
    const onboardingOverrides = {
        setState: vi.fn(),
        clearState: vi.fn(),
    } satisfies Pick<OnboardingOverrideService, 'setState' | 'clearState'>;

    const onboardingService = {
        markOnboardingCompleted: vi.fn(),
        resetOnboarding: vi.fn(),
        openOnboarding: vi.fn(),
        closeOnboarding: vi.fn(),
        bypassOnboarding: vi.fn(),
        resumeOnboarding: vi.fn(),
        saveOnboardingDraft: vi.fn(),
        getOnboardingResponse: vi.fn(),
        clearActivationDataCache: vi.fn(),
    } satisfies Pick<
        OnboardingService,
        | 'markOnboardingCompleted'
        | 'resetOnboarding'
        | 'openOnboarding'
        | 'closeOnboarding'
        | 'bypassOnboarding'
        | 'resumeOnboarding'
        | 'saveOnboardingDraft'
        | 'getOnboardingResponse'
        | 'clearActivationDataCache'
    >;

    const onboardingInternalBootService = {
        createInternalBootPool: vi.fn(),
        refreshInternalBootContext: vi.fn(),
    } satisfies Pick<
        OnboardingInternalBootService,
        'createInternalBootPool' | 'refreshInternalBootContext'
    >;

    const defaultOnboardingResponse = {
        status: OnboardingStatus.INCOMPLETE,
        isPartnerBuild: false,
        completed: false,
        completedAtVersion: undefined,
        shouldOpen: false,
        onboardingState: {
            registrationState: null,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        },
        wizard: {
            currentStepId: 'OVERVIEW',
            visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY', 'NEXT_STEPS'],
            draft: {},
            internalBootState: {
                applyAttempted: false,
                applySucceeded: false,
            },
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
        onboardingService.openOnboarding.mockResolvedValue(undefined);
        onboardingService.closeOnboarding.mockResolvedValue(undefined);
        onboardingService.bypassOnboarding.mockResolvedValue(undefined);
        onboardingService.resumeOnboarding.mockResolvedValue(undefined);
        onboardingService.saveOnboardingDraft.mockResolvedValue(undefined);
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

    it('delegates openOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            shouldOpen: true,
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.openOnboarding()).resolves.toEqual(response);
        expect(onboardingService.openOnboarding).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('delegates closeOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            shouldOpen: false,
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.closeOnboarding()).resolves.toEqual(response);
        expect(onboardingService.closeOnboarding).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('logs save-failure close reasons before delegating closeOnboarding', async () => {
        const loggerWarn = vi.fn();
        (resolver as unknown as { logger: { warn: (message: string) => void } }).logger.warn =
            loggerWarn;

        await expect(
            resolver.closeOnboarding({ reason: CloseOnboardingReason.SAVE_FAILURE })
        ).resolves.toEqual(defaultOnboardingResponse);

        expect(loggerWarn).toHaveBeenCalledWith('closeOnboarding invoked with reason=SAVE_FAILURE');
        expect(onboardingService.closeOnboarding).toHaveBeenCalledTimes(1);
    });

    it('delegates bypassOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            shouldOpen: false,
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.bypassOnboarding()).resolves.toEqual(response);
        expect(onboardingService.bypassOnboarding).toHaveBeenCalledTimes(1);
        expect(onboardingService.getOnboardingResponse).toHaveBeenCalledWith();
    });

    it('delegates resumeOnboarding through the onboarding service', async () => {
        const response = {
            ...defaultOnboardingResponse,
            shouldOpen: true,
        };
        onboardingService.getOnboardingResponse.mockResolvedValue(response);

        await expect(resolver.resumeOnboarding()).resolves.toEqual(response);
        expect(onboardingService.resumeOnboarding).toHaveBeenCalledTimes(1);
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

    it('delegates saveOnboardingDraft through the onboarding service', async () => {
        const input: SaveOnboardingDraftInput = {
            draft: {
                coreSettings: {
                    serverName: 'Tower',
                },
                plugins: {
                    selectedIds: ['community.applications'],
                },
            },
            navigation: {
                currentStepId: OnboardingWizardStepId.ADD_PLUGINS,
            },
            internalBootState: {
                applyAttempted: true,
                applySucceeded: false,
            },
        };

        await expect(resolver.saveOnboardingDraft(input)).resolves.toBe(true);
        expect(onboardingService.saveOnboardingDraft).toHaveBeenCalledWith(input);
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

    it('delegates refreshInternalBootContext to onboarding internal boot service', async () => {
        onboardingInternalBootService.refreshInternalBootContext.mockResolvedValue({
            arrayStopped: true,
            bootEligible: true,
            bootedFromFlashWithInternalBootSetup: false,
            enableBootTransfer: 'yes',
            reservedNames: [],
            shareNames: [],
            poolNames: [],
            assignableDisks: [],
            driveWarnings: [],
        });

        await expect(resolver.refreshInternalBootContext()).resolves.toEqual({
            arrayStopped: true,
            bootEligible: true,
            bootedFromFlashWithInternalBootSetup: false,
            enableBootTransfer: 'yes',
            reservedNames: [],
            shareNames: [],
            poolNames: [],
            assignableDisks: [],
            driveWarnings: [],
        });
        expect(onboardingInternalBootService.refreshInternalBootContext).toHaveBeenCalledWith();
    });
});
