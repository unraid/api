/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '../../../core/states';
import { ensurePermission } from '../../../core/utils';
import { Context, getServers } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'owner',
		action: 'read',
		possession: 'any'
	});

	// Get all servers
	const servers = await getServers();

	// Return the owner of this server
	return servers.find(server => server.guid === varState.data.regGuid)?.owner;
};
