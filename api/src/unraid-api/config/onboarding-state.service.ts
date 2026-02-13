import { Injectable, Logger } from '@nestjs/common';

import type { ActivationStepContext } from '@app/unraid-api/graph/resolvers/customization/activation-steps.util.js';
import { getters } from '@app/store/index.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import {
    findActivationCodeFileInDirs,
    getActivationDirCandidates,
} from '@app/unraid-api/graph/resolvers/customization/activation-steps.util.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

const REGISTERED_STATES = new Set<RegistrationState>([
    RegistrationState.TRIAL,
    RegistrationState.BASIC,
    RegistrationState.PLUS,
    RegistrationState.PRO,
    RegistrationState.STARTER,
    RegistrationState.UNLEASHED,
    RegistrationState.LIFETIME,
]);

const ACTIVATION_STEP_STATES = new Set<RegistrationState>([
    RegistrationState.ENOKEYFILE,
    RegistrationState.ENOKEYFILE1,
    RegistrationState.ENOKEYFILE2,
]);

@Injectable()
export class OnboardingStateService {
    private readonly logger = new Logger(OnboardingStateService.name);

    constructor(private readonly onboardingOverrides: OnboardingOverrideService) {}

    getRegistrationState(): RegistrationState | undefined {
        const override = this.onboardingOverrides.getState();
        if (override?.registrationState !== undefined) {
            return override.registrationState;
        }

        return (getters.emhttp().var?.regState as RegistrationState | undefined) ?? undefined;
    }

    isFreshInstall(regState: RegistrationState | undefined = this.getRegistrationState()): boolean {
        if (!regState) {
            return false;
        }
        // Only ENOKEYFILE (without number suffix) indicates a fresh install.
        // ENOKEYFILE1 and ENOKEYFILE2 are error states that can occur on existing installations.
        return regState === RegistrationState.ENOKEYFILE;
    }

    requiresActivationStep(
        regState: RegistrationState | undefined = this.getRegistrationState()
    ): boolean {
        if (!regState) {
            return false;
        }
        return ACTIVATION_STEP_STATES.has(regState);
    }

    isRegistered(regState: RegistrationState | undefined = this.getRegistrationState()): boolean {
        if (!regState) {
            return false;
        }
        return REGISTERED_STATES.has(regState);
    }

    async hasActivationCode(): Promise<boolean> {
        const override = this.onboardingOverrides.getState();
        if (override?.activationCode !== undefined) {
            return Boolean(override.activationCode);
        }

        const paths = getters.paths?.() ?? {};
        const activationBase = paths.activationBase as string | undefined;
        if (!activationBase) {
            return false;
        }

        const activationPath = await findActivationCodeFileInDirs(
            getActivationDirCandidates(activationBase),
            '.activationcode',
            this.logger
        );
        return Boolean(activationPath);
    }

    async activationRequired(): Promise<boolean> {
        return (await this.hasActivationCode()) && this.requiresActivationStep();
    }

    async getActivationStepContext(): Promise<ActivationStepContext> {
        const regState = this.getRegistrationState();
        const hasActivationCode = await this.hasActivationCode();
        return {
            hasActivationCode,
            regState,
        };
    }
}
