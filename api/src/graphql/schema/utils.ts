/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { hasSubscribedToChannel } from '@app/ws';
import { getServers as getUserServers } from '@app/utils';
import { User } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { pubsub } from '@app/core/pubsub';
import { varState } from '@app/core/states/var';
import { networkState } from '@app/core/states/network';
import { logger } from '@app/core/log';
import { getters, store } from '@app/store';
import { cacheServers, Server } from '@app/store/modules/servers';

export interface Context {
	user?: User;
	websocketId: string;
}

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 * @param resource The access-control permission resource to check against.
 */
export const createSubscription = (channel: string, resource?: string) => ({
	subscribe(_: unknown, __: unknown, context: Context) {
		if (!context.user) {
			throw new AppError('<ws> No user found in context.', 500);
		}

		// Check the user has permission to subscribe to this endpoint
		ensurePermission(context.user, {
			resource: resource ?? channel,
			action: 'read',
			possession: 'any',
		});

		hasSubscribedToChannel(context.websocketId, channel);
		return pubsub.asyncIterator(channel);
	},
});

const getLocalServer = (): [Server] => {
	const guid = varState?.data?.regGuid;
	const name = varState?.data?.name;
	const wanip = null;
	const lanip: string = networkState.data[0].ipaddr[0];
	const port = varState?.data?.port;
	const localurl = `http://${lanip}:${port}`;
	const remoteurl = null;

	return [{
		owner: {
			username: 'root',
			url: '',
			avatar: '',
		},
		guid,
		apikey: '',
		name,
		status: 'online',
		wanip,
		lanip,
		localurl,
		remoteurl,
	}];
};

export const getServers = async (): Promise<Server[]> => {
	// For now use the my_servers key
	// Later we should return the correct one for the current user with the correct scope, etc.
	const apiKey = getters.config().remote.apikey;

	// Return only current server if we have no key
	if (!apiKey) return getLocalServer();

	// Check if we have the servers already cached, if so return them
	const cachedServers = getters.servers().servers;
	if (cachedServers.length >= 1) return cachedServers;

	// Fetch servers from mothership
	const servers = await getUserServers(apiKey);

	// If no servers are found return the local copy
	if (!servers || servers.length === 0) {
		logger.trace('Generating response locally for "servers" endpoint');
		return getLocalServer();
	}

	// Cache servers
	store.dispatch(cacheServers(servers));

	// Publish owner event
	await pubsub.publish('owner', {
		owner: servers?.[0]?.owner,
	});

	// Return servers from mothership
	return servers;
};
