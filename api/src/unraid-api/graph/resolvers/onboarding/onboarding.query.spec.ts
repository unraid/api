import { describe, expect, it, vi } from 'vitest';

import type { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import { OnboardingQueryResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.query.js';

describe('OnboardingQueryResolver', () => {
    it('delegates internalBootContext to the onboarding internal boot service', async () => {
        const onboardingInternalBootService = {
            getInternalBootContext: vi.fn().mockResolvedValue({
                arrayStopped: true,
                bootEligible: true,
                bootedFromFlashWithInternalBootSetup: false,
                enableBootTransfer: 'yes',
                reservedNames: [],
                shareNames: [],
                poolNames: [],
                assignableDisks: [],
                driveWarnings: [],
            }),
        } satisfies Pick<OnboardingInternalBootService, 'getInternalBootContext'>;

        const resolver = new OnboardingQueryResolver(
            onboardingInternalBootService as unknown as OnboardingInternalBootService
        );

        await expect(resolver.internalBootContext()).resolves.toEqual({
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
        expect(onboardingInternalBootService.getInternalBootContext).toHaveBeenCalledWith();
    });
});
