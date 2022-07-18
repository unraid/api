/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateData } from '@app/common/dashboard/generate-data';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'dashboard',
		action: 'read',
		possession: 'own',
	});

	const dashboard = await generateData();
	return dashboard;
};
