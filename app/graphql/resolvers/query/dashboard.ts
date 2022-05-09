/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateData } from '../../../common/dashboard/generate-data';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'dashboard',
		action: 'read',
		possession: 'own'
	});

	return generateData();
};
