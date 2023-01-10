/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import type { CoreContext, CoreResult } from '@app/core/types';
import { API_VERSION } from '@app/environment';

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
	// Check permissions
	ensurePermission(context.user, {
		resource: 'service/unraid-api',
		action: 'read',
		possession: 'any',
	});

	const now = new Date();
	const uptimeTimestamp = startTimestamp.toISOString();
	const uptimeSeconds = (now.getTime() - startTimestamp.getTime());

	const service = {
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: uptimeTimestamp,
			seconds: uptimeSeconds,
		},
		version: API_VERSION,
	};

	return {
		text: `Service: ${JSON.stringify(service, null, 2)}`,
		json: service,
	};
};
