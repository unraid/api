/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { parse } from 'semver';
import { CacheManager } from '@app/core/cache-manager';
import { FatalAppError } from '@app/core/errors/fatal-error';
import { FileMissingError } from '@app/core/errors/file-missing-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import type { CoreResult, CoreContext } from '@app/core/types';
import { readFile } from 'fs/promises';
import { getters } from '@app/store';

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
		possession: 'any',
	});

	let version = cache.get<string>('version');

	// Only update when cache is empty or doesn't exist yet
	if (!version) {
		const filePath = getters.paths()['unraid-version'];
		const file = await readFile(filePath)
			.catch(() => {
				throw new FileMissingError(filePath);
			})
			.then(buffer => buffer.toString());

		// Ensure string is semver compliant
		const semverVersion = parse(file.split('"')[1])?.version;

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
			unraid: version,
		},
	};
};
