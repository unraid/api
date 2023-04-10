/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getServers } from '@app/graphql/schema/utils';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { ServerStatus, type Resolvers } from '../../generated/api/types';

export const servers: NonNullable<Resolvers['Query']>['servers'] = async (_, __, context) => {
	ensurePermission(context.user, {
		resource: 'servers',
		action: 'read',
		possession: 'any',
	});

	// All servers
	const servers = getServers().map(server => ({
		...server,
		apikey: server.apikey ?? '',
		guid: server.guid ?? '',
		lanip: server.lanip ?? '',
		localurl: server.localurl ?? '',
		wanip: server.wanip ?? '',
		name: server.name ?? '',
		owner: {
			...server.owner,
			username: server.owner?.username ?? ''
		},
		remoteurl: server.remoteurl ?? '',
		status: server.status ?? ServerStatus.OFFLINE
	}))
	return servers;
};
