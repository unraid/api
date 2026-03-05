import { coerce, eq, gt, lt, major, minor } from 'semver';

import { compareVersions } from '@app/common/compare-semver-version.js';

export const hasOnboardingVersionDrift = (
    completedAtVersion: string | undefined,
    currentVersion: string
): boolean => {
    if (!completedAtVersion) {
        return false;
    }

    const current = coerce(currentVersion, { includePrerelease: true });
    const completed = coerce(completedAtVersion, { includePrerelease: true });

    if (current && completed) {
        if (major(current) === major(completed) && minor(current) === minor(completed)) {
            return false;
        }

        return !compareVersions(current, completed, eq, { includePrerelease: true });
    }

    // Fallback for non-semver strings.
    return completedAtVersion !== currentVersion;
};

export const getOnboardingVersionDirection = (
    completedAtVersion: string | undefined,
    currentVersion: string
): 'UPGRADE' | 'DOWNGRADE' | undefined => {
    if (!completedAtVersion) {
        return undefined;
    }

    const current = coerce(currentVersion, { includePrerelease: true });
    const completed = coerce(completedAtVersion, { includePrerelease: true });

    if (current && completed) {
        if (major(current) === major(completed) && minor(current) === minor(completed)) {
            return undefined;
        }

        if (compareVersions(current, completed, gt, { includePrerelease: true })) {
            return 'UPGRADE';
        }

        if (compareVersions(current, completed, lt, { includePrerelease: true })) {
            return 'DOWNGRADE';
        }

        return undefined;
    }

    // Fallback: unknown string ordering can't reliably infer downgrade.
    return completedAtVersion !== currentVersion ? 'UPGRADE' : undefined;
};
