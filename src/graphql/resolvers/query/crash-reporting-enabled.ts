/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'crash-reporting-enabled',
		action: 'read',
		possession: 'any'
	});

	// Check if crash reporting is enabled
	return false;
};
