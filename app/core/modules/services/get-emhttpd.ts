/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import execa from 'execa';
import { cleanStdout, ensurePermission } from '../../utils';
import { CoreContext, CoreResult } from '../../types';

interface Result extends CoreResult {
	json: {
		online: boolean;
		uptime: number;
	};
}

/**
 * Get emhttpd service info.
 */
export const getEmhttpdService = async(context: CoreContext): Promise<Result> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'service/emhttpd',
		action: 'read',
		possession: 'any'
	});

	// Only get uptime if process is online
	const uptime = await execa('ps', ['-C', 'emhttpd', '-o', 'etimes', '--no-headers'])
		.then(cleanStdout)
		.then(uptime => Number.parseInt(uptime, 10))
		.catch(() => -1);

	const online = uptime >= 1;

	return {
		text: `Online: ${online}\n Uptime: ${uptime}`,
		json: {
			online,
			uptime
		}
	};
};
