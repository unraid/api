import type {
    ActivationCode,
    ActivationOnboardingStepId,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import type { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

export type ActivationOnboardingOverrideStepState = {
    id: ActivationOnboardingStepId;
    required?: boolean;
    completed?: boolean;
    introducedIn?: string;
};

export type ActivationOnboardingOverrideState = {
    currentVersion?: string | null;
    previousVersion?: string | null;
    isUpgrade?: boolean;
    steps?: ActivationOnboardingOverrideStepState[];
};

export type OnboardingOverrideState = {
    activationOnboarding?: ActivationOnboardingOverrideState;
    activationCode?: ActivationCode | null;
    partnerInfo?: PublicPartnerInfo | null;
    registrationState?: RegistrationState;
    isInitialSetup?: boolean;
};
