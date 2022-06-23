/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import si from 'systeminformation';
import { CacheManager } from '@app/core/cache-manager';
import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

const cache = new CacheManager('unraid:modules:get-system-versions');

/**
 * Software versions.
 * @returns Versions of all the core software.
 */
export const getSoftwareVersions = async (context: CoreContext): Promise<CoreResult<si.Systeminformation.VersionData>> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'software-versions',
		action: 'read',
		possession: 'any'
	});

	let versions = cache.get<si.Systeminformation.VersionData>('versions');

	// Only update when cache is empty or doesn't exist yet
	if (!versions) {
		versions = await si.versions();
		cache.set('versions', versions);
	}

	return {
		text: `System versions: ${JSON.stringify(versions, null, 2)}`,
		json: versions
	};
};
