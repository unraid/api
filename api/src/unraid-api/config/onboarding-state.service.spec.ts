import { describe, expect, it, vi } from 'vitest';

import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

describe('OnboardingStateService', () => {
    const createService = () => {
        const overrides = {
            getState: vi.fn().mockReturnValue(null),
        };

        return new OnboardingStateService(overrides as any);
    };

    it.each([
        RegistrationState.ENOKEYFILE,
        RegistrationState.ENOKEYFILE1,
        RegistrationState.ENOKEYFILE2,
    ])('requiresActivationStep returns true for %s', (state) => {
        const service = createService();
        expect(service.requiresActivationStep(state)).toBe(true);
    });

    it('requiresActivationStep returns false for non-activation states', () => {
        const service = createService();
        expect(service.requiresActivationStep(RegistrationState.BASIC)).toBe(false);
    });

    it('activationRequired uses activation-step states, including ENOKEYFILE1/2', async () => {
        const service = createService();
        vi.spyOn(service, 'hasActivationCode').mockResolvedValue(true);
        vi.spyOn(service, 'getRegistrationState').mockReturnValue(RegistrationState.ENOKEYFILE1);

        await expect(service.activationRequired()).resolves.toBe(true);
    });
});
