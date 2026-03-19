import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingStatus } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

describe('CustomizationResolver', () => {
    const onboardingService = {
        getActivationData: vi.fn(),
        getActivationDataForPublic: vi.fn(),
        getPublicPartnerInfo: vi.fn(),
        getTheme: vi.fn(),
        isFreshInstall: vi.fn(),
        getOnboardingState: vi.fn(),
        getOnboardingResponse: vi.fn(),
    } as unknown as OnboardingService;
    const displayService = {
        getAvailableLanguages: vi.fn(),
    } as unknown as DisplayService;

    const resolver = new CustomizationResolver(onboardingService, displayService);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(onboardingService.getPublicPartnerInfo).mockResolvedValue(null);
        vi.mocked(onboardingService.getActivationDataForPublic).mockResolvedValue(null);
        vi.mocked(onboardingService.getOnboardingState).mockResolvedValue({
            registrationState: undefined,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        });
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: false,
            completed: false,
            completedAtVersion: undefined,
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('throws when tracker state could not be read', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockRejectedValue(
            new Error('permission denied')
        );

        await expect(resolver.resolveOnboarding()).rejects.toThrow();
    });

    it('returns INCOMPLETE status when not completed', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: false,
            completed: false,
            completedAtVersion: undefined,
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: false,
            completed: false,
            completedAtVersion: undefined,
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('returns COMPLETED status when completed on current version', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('returns COMPLETED status when completed on a prior patch of current minor', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.1',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.1',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('returns UPGRADE status when completed on older version', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.UPGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.1.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.UPGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.1.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('returns DOWNGRADE status when completed on newer version', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.DOWNGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.3.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.DOWNGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.3.0',
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });
    });

    it('returns isPartnerBuild true when partner info exists', async () => {
        vi.mocked(onboardingService.getOnboardingResponse).mockResolvedValue({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: true,
            completed: false,
            completedAtVersion: undefined,
            shouldOpen: false,
            onboardingState: {
                registrationState: undefined,
                isRegistered: false,
                isFreshInstall: false,
                hasActivationCode: false,
                activationRequired: false,
            },
        });

        const result = await resolver.resolveOnboarding();

        expect(result.isPartnerBuild).toBe(true);
        expect(result.status).toBe(OnboardingStatus.INCOMPLETE);
    });

    it('resolves available languages via display service', async () => {
        vi.mocked(displayService.getAvailableLanguages).mockResolvedValue([
            { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
        ]);

        const result = await resolver.resolveAvailableLanguages();

        expect(displayService.getAvailableLanguages).toHaveBeenCalledOnce();
        expect(result).toEqual([
            { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
        ]);
    });

    it('resolves activation code via public-normalized activation data', async () => {
        vi.mocked(onboardingService.getActivationDataForPublic).mockResolvedValue({
            code: 'CODE-123',
            branding: {
                partnerLogoLightUrl: 'data:image/svg+xml;base64,AAA=',
                partnerLogoDarkUrl: 'data:image/svg+xml;base64,BBB=',
            },
        } as any);

        const result = await resolver.activationCode();

        expect(onboardingService.getActivationDataForPublic).toHaveBeenCalledOnce();
        expect(result).toEqual({
            code: 'CODE-123',
            branding: {
                partnerLogoLightUrl: 'data:image/svg+xml;base64,AAA=',
                partnerLogoDarkUrl: 'data:image/svg+xml;base64,BBB=',
            },
        });
    });
});
