import type {
    ActivationOnboardingOverrideState,
    OnboardingOverrideState,
} from '@app/unraid-api/config/onboarding-override.model.js';

export type CompletedStepState = {
    version: string;
    completedAt: string;
};

export type TrackerState = {
    lastTrackedVersion?: string;
    updatedAt?: string;
    // List of OS versions where onboarding has been completed
    completedVersions?: string[];
    firstBootCompletedAt?: string;
};

export type UpgradeProgressSnapshot = {
    currentVersion?: string;
    lastTrackedVersion?: string;
    completed: boolean;
};
