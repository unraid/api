import semver from 'semver';
import { varState } from '../core/states/var';

/**
 * Compare version against the current unraid version.
 */
export const compareUnraidVersion = (range: string) => semver.satisfies(varState.data.version, range, { includePrerelease: true });
