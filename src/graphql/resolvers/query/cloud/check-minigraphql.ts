/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { getServers } from '@app/graphql/schema/utils';
import { CachedServer } from '@app/cache/user';
import { varState } from '@app/core/states';
import { getMinigraphqlConnectionStatus } from '@app/mothership/get-mini-graphql-connection-status';

export const checkMinigraphql = async () => {
	logger.trace('Cloud endpoint: Checking mini-graphql');
	try {
		const wsStatus = getMinigraphqlConnectionStatus();
		const servers = await getServers().catch(() => [] as CachedServer[]);
		const thisServer = servers.find(server => server.guid === varState.data.flashGuid);
		return {
			connected: wsStatus && thisServer?.owner?.username !== 'root'
		};
	} finally {
		logger.trace('Cloud endpoint: Done mini-graphql');
	}
};
