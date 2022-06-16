import { readFile } from 'fs/promises';
import semver from 'semver';
import { paths } from '@app/core/paths';

let unraidVersion: string;

/**
 * Unraid version string.
 * @returns The current version.
 */
export const getUnraidVersion = async (): Promise<string> => {
	// If we already have the version just return it
	if (unraidVersion) return unraidVersion;

	// Get unraid version from file
	const filePath = paths['unraid-version'];
	const file = await readFile(filePath).then(buffer => buffer.toString());

	// Ensure string is semver compliant
	const semverVersion = semver.parse(file.split('"')[1])?.version;

	// If we can't get the version then return "unknown"
	if (!semverVersion) return 'unknown';

	unraidVersion = semverVersion;
	return unraidVersion;
};
