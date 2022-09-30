import { getters } from '@app/store';
import { satisfies } from 'semver';

/**
 * Compare version against the current unraid version.
 */
export const compareUnraidVersion = (range: string) => satisfies(getters.emhttp().var.version, range, { includePrerelease: true });
