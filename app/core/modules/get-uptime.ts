/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import os from 'os';
import { ensurePermission } from '../utils';
import { CoreResult, CoreContext } from '../types';

interface Result extends CoreResult {
	json: {
		milliseconds: number;
		timestamp: string;
	}
}

/**
 * OS uptime
 * @returns The milliseconds since we booted.
 */
export const getUptime = async(context: CoreContext): Promise<Result> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'uptime',
		action: 'read',
		possession: 'any'
	});

	const uptime = new Date(os.uptime());
	const humanFormat = uptime.getTime();

	return {
		text: `Uptime: ${humanFormat}`,
		json: {
			milliseconds: uptime.getTime(),
			timestamp: uptime.toISOString()
		}
	};
};
