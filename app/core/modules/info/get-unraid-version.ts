/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'node:fs';
import semver from 'semver';
import { paths } from '../../paths';
import { CacheManager } from '../../cache-manager';
import { FileMissingError, FatalAppError } from '../../errors';
import { ensurePermission } from '../../utils';
import { CoreResult, CoreContext } from '../../types';

const cache = new CacheManager('unraid:modules:get-unraid-version');

interface Result extends CoreResult {
	json: {
		unraid: string;
	};
}

/**
 * Unraid version string.
 * @returns The current version.
 */
export const getUnraidVersion = async (context: CoreContext): Promise<Result> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'unraid-version',
		action: 'read',
		possession: 'any'
	});

	let version = cache.get<string>('version');

	// Only update when cache is empty or doesn't exist yet
	if (!version) {
		const filePath = paths.get('unraid-version')!;
		const file = await fs.promises.readFile(filePath)
			.catch(() => {
				throw new FileMissingError(filePath);
			})
			.then(buffer => buffer.toString());

		// Ensure string is semver compliant
		const semverVersion = semver.parse(file.split('"')[1])?.version;

		if (!semverVersion) {
			throw new FatalAppError('Invalid unraid version file.');
		}

		version = semverVersion;

		// Update cache
		cache.set('version', version);
	}

	return {
		text: `Version: ${version}`,
		json: {
			unraid: version
		}
	};
};
