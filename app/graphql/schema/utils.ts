/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { pubsub, utils, errors, states, apiManager, graphqlLogger } from '../../core';
import { hasSubscribedToChannel } from '../../ws';
import { userCache, CachedServer, CachedServers } from '../../cache';
import { getServers as getUserServers } from '../../utils';

const { varState, networkState } = states;

const { ensurePermission } = utils;
const { AppError } = errors;

export interface Context {
	user: any;
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

		// Check the user has permissison to subscribe to this endpoint
		ensurePermission(context.user, {
			resource: resource ?? channel,
			action: 'read',
			possession: 'any'
		});

		hasSubscribedToChannel(context.websocketId, channel);
		return pubsub.asyncIterator(channel);
	}
});

// Add null to types
type makeNullUndefinedAndOptional<T> = {
	[K in keyof T]?: T[K] | null | undefined;
};

type Server = makeNullUndefinedAndOptional<CachedServer>;

export const getServers = async (): Promise<Server[]> => {
	// Check if we have the servers already cached, if so return them
	const cachedServers = userCache.get<CachedServers>('mine')?.servers;
	if (cachedServers) {
		return cachedServers;
	}

	// For now use the my_servers key
	// Later we should return the correct one for the current user with the correct scope, etc.
	const apiKey = apiManager.getValidKeys().find(key => key.name === 'my_servers')?.key.toString()!;

	// No cached servers found
	if (!cachedServers) {
		// Fetch servers from mothership
		const servers = await getUserServers(apiKey);

		graphqlLogger.debug('Using upstream for /servers endpoint');

		// No servers found
		if (!servers || servers.length === 0) {
			return [];
		}

		// Cache servers
		userCache.set<CachedServers>('mine', {
			servers
		});

		// Get first server's owner object
		const owner = servers[0].owner;

		// Publish owner event
		await pubsub.publish('owner', {
			owner
		});

		// Return servers from mothership
		return servers;
	}

	graphqlLogger.debug('Falling back to local state for /servers endpoint');
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
			avatar: ''
		},
		guid,
		apikey: apiKey,
		name,
		status: 'online',
		wanip,
		lanip,
		localurl,
		remoteurl
	}];
};
