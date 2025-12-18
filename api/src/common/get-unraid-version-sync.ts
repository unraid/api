import type { SemVer } from 'semver';
import { coerce } from 'semver';

import { compareVersions } from '@app/common/compare-semver-version.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';

type UnraidVersionIni = {
    version?: string;
};

/**
 * Synchronously reads the Unraid version from /etc/unraid-version
 * @returns The Unraid version string, or 'unknown' if the file cannot be read
 */
export const getUnraidVersionSync = (): string => {
    const versionPath = '/etc/unraid-version';

    if (!fileExistsSync(versionPath)) {
        return 'unknown';
    }

    try {
        const versionIni = parseConfig<UnraidVersionIni>({ filePath: versionPath, type: 'ini' });
        return versionIni.version || 'unknown';
    } catch {
        return 'unknown';
    }
};

/**
 * Compares the Unraid version against a specified version using a comparison function
 * @param compareFn - The comparison function from semver (e.g., lt, gte, lte, gt, eq)
 * @param version - The version to compare against (e.g., '7.3.0')
 * @param options - Options for the comparison
 * @returns The result of the comparison, or false if the version cannot be determined
 */
export const compareUnraidVersionSync = (
    compareFn: (a: SemVer, b: SemVer) => boolean,
    version: string,
    { includePrerelease = true }: { includePrerelease?: boolean } = {}
): boolean => {
    const currentVersion = getUnraidVersionSync();
    if (currentVersion === 'unknown') {
        return false;
    }

    try {
        const current = coerce(currentVersion, { includePrerelease });
        const compared = coerce(version, { includePrerelease });

        if (!current || !compared) {
            return false;
        }

        return compareVersions(current, compared, compareFn, { includePrerelease });
    } catch {
        return false;
    }
};
