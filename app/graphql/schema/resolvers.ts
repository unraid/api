/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import { pluginManager, pubsub, utils, bus, errors, states, modules, apiManager, log } from '@unraid/core';
import dee from '@gridplus/docker-events';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import GraphQLJSON from 'graphql-type-json';
import GraphQLLong from 'graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import fetch from 'cross-fetch';
import { run, publish } from '../../run';
import { userCache, CachedServer, CachedServers } from '../../cache';
import { hasSubscribedToChannel } from '../../ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '../../consts';

const { ensurePermission } = utils;
const { usersState, varState, networkState } = states;
const { AppError, PluginError } = errors;

// Update array values when slots change
bus.on('slots', async () => {
	// @todo: Create a system user for this
	const user = usersState.findOne({ name: 'root' });

	await run('array', 'UPDATED', {
		moduleToRun: modules.getArray,
		context: {
			user
		}
	});
});

// On Docker event update info with { apps: { installed, started } }
dee.on('*', async (data: { Type: string }) => {
	// Only listen to container events
	if (data.Type !== 'container') {
		return;
	}

	const { json } = await modules.getApps();
	publish('info', 'UPDATED', json);
});

dee.listen();

// This needs to be fixed to run from events
setIntervalAsync(async () => {
	// @todo: Create a system user for this
	const user = usersState.findOne({ name: 'root' });

	await run('services', 'UPDATED', {
		moduleToRun: modules.getServices,
		context: {
			user
		}
	});
}, 1000);

interface Context {
	user: any;
	websocketId: string;
};

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 * @param resource The access-control permission resource to check against.
 */
const createSubscription = (channel: string, resource?: string) => ({
	subscribe(_: unknown, __: unknown, context: Context) {
		if (!context.user) {
			throw new AppError('<ws> No user found in context.', 500);
		}

		// Check the user has permissison to subscribe to this endpoint
		ensurePermission(context.user, {
			resource: resource || channel,
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

const getServers = async (): Promise<Server[]> => {
	const cachedServers = userCache.get<CachedServers>('mine')?.servers;

	// No cached servers found
	if (!cachedServers) {
		// Fetch servers from mothership
		const servers = await fetch(MOTHERSHIP_GRAPHQL_LINK, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({
				query: "{ servers { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }"
			})
		}).then(r => r.json() as Promise<CachedServer[]>);

		log.debug('Using upstream for /servers endpoint');

		// No servers found
		if (servers.length === 0) {
			return [];
		}

		console.log({servers});

		// @todo: Cache servers
		// userCache.set<CachedServers>('mine', {
		// 	servers
		// })

		// Return servers from mothership
		return servers;
	}

	log.debug('Falling back to local state for /servers endpoint');
	const guid = varState?.data?.regGuid;
	// For now use the my_servers key
	// Later we should return the correct one for the current user with the correct scope, etc.
	const apikey = apiManager.getValidKeys().find(key => key.name === 'my_servers')?.key.toString();
	const name = varState?.data?.name;
	const wanip = null;
	const lanip = networkState.data[0].ipaddr[0];
	const localurl = `http://${lanip}:${varState?.data?.port}`;
	const remoteurl = null;

	return [{
		owner: {
			username: 'root',
			url: '',
			avatar: ''
		},
		guid,
		apikey,
		name,
		status: 'online',
		wanip,
		lanip,
		localurl,
		remoteurl
	}];
};

export const resolvers = {
	Query: {
		online: () => true,
		info: () => ({}),
		vms: () => ({}),
		server(_: unknown, { name }, context: Context) {
			ensurePermission(context.user, {
				resource: 'servers',
				action: 'read',
				possession: 'any'
			});

			// Single server
			return getServers().then(server => server.find(server => server.name === name));
		},
		servers(_: unknown, __: unknown, context: Context) {
			ensurePermission(context.user, {
				resource: 'servers',
				action: 'read',
				possession: 'any'
			});
			
			// All servers
			return getServers();
		}
	},
	Subscription: {
		apikeys: {
			// Not sure how we're going to secure this
			// ...createSubscription('apikeys')
		},
		array: {
			...createSubscription('array')
		},
		// devices: {
		// 	...createSubscription('device')
		// },
		dockerContainers: {
			...createSubscription('docker/container')
		},
		dockerNetworks: {
			...createSubscription('docker/network')
		},
		info: {
			...createSubscription('info')
		},
		ping: {
			// subscribe: (_, __, context) => {
			// 	// startPing();
			// hasSubscribedToChannel(context.websocketId, 'ping');
			// 	return pubsub.asyncIterator('ping');
			// }
		},
		services: {
			...createSubscription('services')
		},
		servers: {
			...createSubscription('servers')
		},
		shares: {
			...createSubscription('shares')
		},
		unassignedDevices: {
			...createSubscription('devices/unassigned')
		},
		users: {
			...createSubscription('users')
		},
		vars: {
			...createSubscription('vars')
		},
		vms: {
			...createSubscription('vms/domains')
		},
		pluginModule: {
			subscribe: async (_: unknown, directiveArgs, context: Context) => {
				const {plugin: pluginName, module: pluginModuleName} = directiveArgs;
				const channel = `${pluginName}/${pluginModuleName}`;

				// Verify plugin is installed and active
				if (!pluginManager.isInstalled(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin not installed.', 500);
				}

				if (!pluginManager.isActive(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin disabled.', 500);
				}

				// It's up to the plugin to publish new data as needed
				// so we'll just return the Iterator
				hasSubscribedToChannel(context.websocketId, channel);
				return pubsub.asyncIterator(channel);
			}
		},
		online: {
			...createSubscription('online')
		}
	},
	JSON: GraphQLJSON,
	Long: GraphQLLong,
	UUID: GraphQLUUID,
	UserAccount: {
		__resolveType(obj) {
			// Only a user has a password field, the current user aka "me" doesn't.
			if (obj.password) {
				return 'User';
			}

			return 'Me';
		}
	}
};