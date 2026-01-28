import type { UpgradeProgressSnapshot } from '@app/unraid-api/config/onboarding-tracker.model.js';
import type { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

export const buildUpgradeInfoFromSnapshot = (snapshot: UpgradeProgressSnapshot): UpgradeInfo => {
    const { currentVersion, lastTrackedVersion } = snapshot;

    const isUpgradeBoolean = Boolean(
        lastTrackedVersion && currentVersion && lastTrackedVersion !== currentVersion
    );

    return {
        isUpgrade: isUpgradeBoolean,
        previousVersion: isUpgradeBoolean ? lastTrackedVersion : undefined,
        currentVersion: currentVersion ?? undefined,
        completedSteps: [],
        steps: [],
    };
};
