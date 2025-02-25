import { satisfies } from 'semver';

import { getters } from '@app/store/index.js';

/**
 * Compare version against the current unraid version.
 */
export const compareUnraidVersion = (range: string) =>
    satisfies(getters.emhttp().var.version, range, { includePrerelease: true });
