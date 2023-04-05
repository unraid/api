/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { hasSubscribedToChannel } from '@app/ws';
import { type User } from '@app/core/types/states/user';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { pubsub } from '@app/core/pubsub';
import { getters } from '@app/store';
import { ServerStatus, type Server } from '@app/graphql/generated/client/graphql';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getLocalServer = (): [Server] => {
	const emhttp = getters.emhttp();
	const guid = emhttp.var.regGuid;
	const { name } = emhttp.var;
	const wanip = null;
	const lanip: string = emhttp.networks[0].ipaddr[0];
	const port = emhttp.var?.port;
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
		status: ServerStatus.ONLINE,
		wanip,
		lanip,
		localurl,
		remoteurl,
	}];
};

export const getServers = (): Server[] => {
	// Check if we have the servers already cached, if so return them
	const cachedServers = getters.servers().servers;
	return cachedServers ?? [];
};
