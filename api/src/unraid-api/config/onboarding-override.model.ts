import type {
    ActivationCode,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import type { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

/**
 * Simplified onboarding override state for testing.
 */
export type OnboardingOverride = {
    /** Whether onboarding has been completed */
    completed?: boolean;
    /** The OS version when onboarding was completed */
    completedAtVersion?: string | null;
};

export type OnboardingOverrideState = {
    /** Override for onboarding completion state */
    onboarding?: OnboardingOverride;
    /** Override for activation code data */
    activationCode?: ActivationCode | null;
    /** Override for partner info */
    partnerInfo?: PublicPartnerInfo | null;
    /** Override for registration state */
    registrationState?: RegistrationState;
};
