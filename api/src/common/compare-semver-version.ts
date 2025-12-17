import type { SemVer } from 'semver';
import { gt, gte, lt, lte } from 'semver';

/**
 * Shared version comparison logic with special handling for prerelease versions.
 *
 * When base versions are equal and current version has a prerelease tag while compared doesn't:
 * - For gte/gt: prerelease is considered greater than stable (returns true)
 * - For lte/lt: prerelease is considered less than stable (returns false)
 * - For eq: prerelease is not equal to stable (returns false)
 *
 * @param currentVersion - The current Unraid version (SemVer object)
 * @param comparedVersion - The version to compare against (SemVer object)
 * @param compareFn - The comparison function (e.g., gte, lte, lt, gt, eq)
 * @param includePrerelease - Whether to include special prerelease handling
 * @returns The result of the comparison
 */
export const compareVersions = (
    currentVersion: SemVer,
    comparedVersion: SemVer,
    compareFn: (a: SemVer, b: SemVer) => boolean,
    { includePrerelease = true }: { includePrerelease?: boolean } = {}
): boolean => {
    if (includePrerelease) {
        const baseCurrent = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
        const baseCompared = `${comparedVersion.major}.${comparedVersion.minor}.${comparedVersion.patch}`;

        if (baseCurrent === baseCompared) {
            const currentHasPrerelease = currentVersion.prerelease.length > 0;
            const comparedHasPrerelease = comparedVersion.prerelease.length > 0;

            if (currentHasPrerelease && !comparedHasPrerelease) {
                if (compareFn === gte || compareFn === gt) {
                    return true;
                }
                if (compareFn === lte || compareFn === lt) {
                    return false;
                }
            }
        }
    }

    return compareFn(currentVersion, comparedVersion);
};
