/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateData } from '../../../common/dashboard/generate-data';
import { logger } from '../../../core/log';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'dashboard',
		action: 'read',
		possession: 'own'
	});

	const dashboard = await generateData();
	logger.debug('Generating dashboard data', dashboard);
	return dashboard;
};
