/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { Context } from '@app/graphql/schema/utils';
import { getServers } from '@app/graphql/schema/utils';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'servers',
		action: 'read',
		possession: 'any'
	});

	// All servers
	return getServers().catch(() => []);
};
