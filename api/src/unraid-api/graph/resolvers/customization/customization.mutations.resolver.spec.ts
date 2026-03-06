import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomizationMutationsResolver } from '@app/unraid-api/graph/resolvers/customization/customization.mutations.resolver.js';

describe('CustomizationMutationsResolver', () => {
    const onboardingService = {
        setTheme: vi.fn(),
    };

    const displayService = {
        setLocale: vi.fn(),
    };

    let resolver: CustomizationMutationsResolver;

    beforeEach(() => {
        vi.clearAllMocks();
        resolver = new CustomizationMutationsResolver(onboardingService as any, displayService as any);
    });

    it('delegates setTheme to onboardingService', async () => {
        const theme = {
            name: 'azure',
            showBannerImage: true,
            showBannerGradient: true,
            showHeaderDescription: true,
            headerBackgroundColor: null,
            headerPrimaryTextColor: null,
            headerSecondaryTextColor: null,
        };
        onboardingService.setTheme.mockResolvedValue(theme);

        const result = await resolver.setTheme('azure' as any);

        expect(onboardingService.setTheme).toHaveBeenCalledWith('azure');
        expect(result).toEqual(theme);
    });

    it('returns persisted locale from display service', async () => {
        displayService.setLocale.mockResolvedValue({ locale: 'fr_FR' });

        const result = await resolver.setLocale('fr_FR');

        expect(displayService.setLocale).toHaveBeenCalledWith('fr_FR');
        expect(result).toBe('fr_FR');
    });

    it('falls back to requested locale when service response omits locale', async () => {
        displayService.setLocale.mockResolvedValue({ locale: null });

        const result = await resolver.setLocale('en_US');

        expect(result).toBe('en_US');
    });
});
