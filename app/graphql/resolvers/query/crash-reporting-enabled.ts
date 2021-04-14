/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { paths } from '../../../core';
import { varState } from '../../../core/states';
import { ensurePermission, loadState } from '../../../core/utils';
import { Context, getServers } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'crash-reporting-enabled',
		action: 'read',
		possession: 'any'
	});

	// Check if crash reporting is enabled
	const configPath = paths.get('myservers-config')!;
	const file = loadState<{ remote: { sendCrashInfo: string } }>(configPath);
	return (file.remote.sendCrashInfo ?? 'no').trim() === 'yes';
};
