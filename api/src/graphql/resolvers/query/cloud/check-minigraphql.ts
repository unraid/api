/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { getServers } from '@app/graphql/schema/utils';
import { getters } from '@app/store';
import { MinigraphStatus } from '@app/store/modules/minigraph';
import { Server } from '@app/store/modules/servers';

export const checkMinigraphql = async (): Promise<{ status: 'connected' | 'disconnected' }> => {
	logger.trace('Cloud endpoint: Checking mini-graphql');
	try {
		// Do we have a connection to mothership?
		const connected = getters.minigraph().status === MinigraphStatus.CONNECTED;
		if (!connected) return { status: 'disconnected' };

		const emhttp = getters.emhttp();

		// Is the server online?
		const servers = await getServers().catch(() => [] as Server[]);
		const thisServer = servers.find(server => server.guid === emhttp.var.flashGuid);
		if (thisServer?.status === 'offline' || thisServer?.owner?.username === 'root') return { status: 'disconnected' };

		// Connected
		return { status: 'connected' };
	} finally {
		logger.trace('Cloud endpoint: Done mini-graphql');
	}
};
