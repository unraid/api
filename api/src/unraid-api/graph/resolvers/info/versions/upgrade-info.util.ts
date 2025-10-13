import type { UpgradeProgressSnapshot } from '@app/unraid-api/config/onboarding-tracker.model.js';
import type { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

export const buildUpgradeInfoFromSnapshot = (snapshot: UpgradeProgressSnapshot): UpgradeInfo => {
    const { currentVersion, lastTrackedVersion, completedSteps, steps } = snapshot;

    const isUpgrade = Boolean(
        lastTrackedVersion && currentVersion && lastTrackedVersion !== currentVersion
    );

    return {
        isUpgrade,
        previousVersion: isUpgrade ? lastTrackedVersion : undefined,
        currentVersion: currentVersion ?? undefined,
        completedSteps,
        steps: steps.map((step) => ({
            id: step.id,
            required: step.required,
            introducedIn: step.introducedIn,
        })),
    };
};
