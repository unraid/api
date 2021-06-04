/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { log } from '../../../core';
import { apiManager } from '../../../core/api-manager';
import { varState } from '../../../core/states';
import { ensurePermission } from '../../../core/utils';
import { Context, getServers } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any'
	});

	const apiKey = apiManager.getValidKeys().find(key => key.name === 'my_servers')?.key.toString()!;

	if (apiKey) {
		log.debug('Found API key for my_servers "%s"', apiKey);
	} else {
		log.debug('Found no API key for my_servers');
	}

	const server = apiKey ? await getServers().then(servers => servers.find(server => server.guid === varState.data.regGuid)) : null;
	return server?.owner;
};
