import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
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
    } as unknown as OnboardingService;
    const onboardingTracker = {
        getState: vi.fn(),
        getCurrentVersion: vi.fn(),
    } as unknown as OnboardingTrackerService;
    const displayService = {
        getAvailableLanguages: vi.fn(),
    } as unknown as DisplayService;

    const resolver = new CustomizationResolver(onboardingService, onboardingTracker, displayService);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(onboardingTracker.getCurrentVersion).mockReturnValue('7.2.0');
        vi.mocked(onboardingService.getPublicPartnerInfo).mockResolvedValue(null);
        vi.mocked(onboardingService.getActivationDataForPublic).mockResolvedValue(null);
        vi.mocked(onboardingService.getOnboardingState).mockResolvedValue({
            registrationState: undefined,
            isRegistered: false,
            isFreshInstall: false,
            hasActivationCode: false,
            activationRequired: false,
        });
    });

    it('returns INCOMPLETE status when not completed', async () => {
        vi.mocked(onboardingTracker.getState).mockReturnValue({
            completed: false,
            completedAtVersion: undefined,
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.INCOMPLETE,
            isPartnerBuild: false,
            completed: false,
            completedAtVersion: undefined,
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
        vi.mocked(onboardingTracker.getState).mockReturnValue({
            completed: true,
            completedAtVersion: '7.2.0',
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.COMPLETED,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.2.0',
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
        vi.mocked(onboardingTracker.getState).mockReturnValue({
            completed: true,
            completedAtVersion: '7.1.0',
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.UPGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.1.0',
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
        vi.mocked(onboardingTracker.getState).mockReturnValue({
            completed: true,
            completedAtVersion: '7.3.0',
        });

        const result = await resolver.resolveOnboarding();

        expect(result).toEqual({
            status: OnboardingStatus.DOWNGRADE,
            isPartnerBuild: false,
            completed: true,
            completedAtVersion: '7.3.0',
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
        vi.mocked(onboardingTracker.getState).mockReturnValue({
            completed: false,
            completedAtVersion: undefined,
        });
        vi.mocked(onboardingService.getPublicPartnerInfo).mockResolvedValue({
            partner: {
                name: 'Test Partner',
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
