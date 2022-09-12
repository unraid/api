import { satisfies } from 'semver';
import { varState } from '@app/core/states/var';

/**
 * Compare version against the current unraid version.
 */
export const compareUnraidVersion = (range: string) => satisfies(varState.data.version, range, { includePrerelease: true });
