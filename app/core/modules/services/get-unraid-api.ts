/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '../../utils';
import { CoreContext, CoreResult } from '../../types';
import packageJson from '../../../../package.json';

interface Result extends CoreResult {
	json: {
		name: string;
		online: boolean;
		uptime: {
			timestamp: string;
			seconds: number;
		};
	};
}

// When this service started
const startTimestamp = new Date();

/**
 * Get Unraid api service info.
 */
export const getUnraidApiService = async (context: CoreContext): Promise<Result> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'service/unraid-api',
		action: 'read',
		possession: 'any'
	});

	const now = new Date();
	const uptimeTimestamp = startTimestamp.toISOString();
	const uptimeSeconds = (now.getTime() - startTimestamp.getTime());

	const service = {
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: uptimeTimestamp,
			seconds: uptimeSeconds
		},
		version: packageJson.version
	};

	return {
		text: `Service: ${JSON.stringify(service, null, 2)}`,
		json: service
	};
};
