/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { uptime } from 'node:os';
import si from 'systeminformation';
import { CoreContext, CoreResult } from '../../types';
import { ensurePermission } from '../../utils';

// Get uptime on boot and convert to date
const bootTimestamp = new Date(Date.now() - (uptime() * 1000));

/**
 * Get OS info
 *
 * @memberof Core
 * @module info/get-os
 */
export const getOs = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'os',
		action: 'read',
		possession: 'any'
	});

	const os = await si.osInfo();

	return {
		get text() {
			return `OS info: ${JSON.stringify(os, null, 2)}`;
		},
		get json() {
			return {
				...os,
				uptime: bootTimestamp
			};
		}
	};
};
