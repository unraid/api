/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { uptime } from 'os';
import si from 'systeminformation';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

// Get uptime on boot and convert to date
const bootTimestamp = new Date(new Date().getTime() - (uptime() * 1000));

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
		possession: 'any',
	});

	const os = await si.osInfo();

	return {
		get text() {
			return `OS info: ${JSON.stringify(os, null, 2)}`;
		},
		get json() {
			return {
				...os,
				uptime: bootTimestamp,
			};
		},
	};
};
