/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getServers } from '../../../graphql/schema/utils';
import { apiManager } from '../../api-manager';
import { log } from '../../log';
import { CoreContext, CoreResult } from '../../types';
import { ensurePermission } from '../../utils';

/**
 * Get server's owner info
 *
 * @memberof Core
 * @module info/get-owner
 */
export const getOwner = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any'
	});

	const apiKey = apiManager.getValidKeys().find(key => key.name === 'my_servers')?.key.toString()!;
	const server = apiKey ? await getServers().then(servers => servers.find(server => server.apikey === apiKey)) : null;

	return {
		get text() {
			return `Owner: ${server?.owner?.username ?? 'root'}`;
		},
		get json() {
			return server === null ? null : {
				...server?.owner
			};
		}
	};
};
