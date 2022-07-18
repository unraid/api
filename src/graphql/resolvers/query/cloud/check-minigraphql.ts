/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { getServers } from '@app/graphql/schema/utils';
import { CachedServer } from '@app/cache/user';
import { varState } from '@app/core/states';
import { getMinigraphqlConnectionStatus } from '@app/mothership/get-mini-graphql-connection-status';

export const checkMinigraphql = async (): Promise<{ status: 'connected' | 'disconnected' }> => {
	logger.trace('Cloud endpoint: Checking mini-graphql');
	try {
		// Do we have a connection to mothership?
		const connected = getMinigraphqlConnectionStatus();
		if (!connected) return { status: 'disconnected' };

		// Is the server online?
		const servers = await getServers().catch(() => [] as CachedServer[]);
		const thisServer = servers.find(server => server.guid === varState.data.flashGuid);
		if (thisServer?.status === 'offline' || thisServer?.owner?.username === 'root') return { status: 'disconnected' };

		// Connected
		return { status: 'connected' };
	} finally {
		logger.trace('Cloud endpoint: Done mini-graphql');
	}
};
