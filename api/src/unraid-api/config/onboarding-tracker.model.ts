import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';

export type CompletedStepState = {
    version: string;
    completedAt: string;
};

export type TrackerState = {
    lastTrackedVersion?: string;
    updatedAt?: string;
    completedSteps?: Record<ActivationOnboardingStepId, CompletedStepState>;
};

export type UpgradeStepState = {
    id: ActivationOnboardingStepId;
    required: boolean;
    introducedIn?: string;
};

export type UpgradeProgressSnapshot = {
    currentVersion?: string;
    lastTrackedVersion?: string;
    completedSteps: ActivationOnboardingStepId[];
    steps: UpgradeStepState[];
};
