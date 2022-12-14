/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { Context } from '@app/graphql/schema/utils';
import { getServers } from '@app/graphql/schema/utils';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

export default async (_: unknown, { name }, context: Context) => {
	ensurePermission(context.user, {
		resource: 'servers',
		action: 'read',
		possession: 'any',
	});

	const servers = getServers();

	// Single server
	return servers.find(server => server.name === name);
};
