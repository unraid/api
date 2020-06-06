/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import { pluginManager, pubsub, utils, bus, errors, states, modules } from '@unraid/core';
import dee from '@gridplus/docker-events';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import GraphQLJSON from 'graphql-type-json';
import GraphQLLong from 'graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import { run, publish } from '../../run';
import { userCache } from '../../cache';
import { hasSubscribedToChannel, canPublishToChannel } from '../../ws';

const { ensurePermission } = utils;
const { usersState } = states;
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
dee.on('*', async (data) => {
	// Only listen to container events
	if (data.Type !== 'container') {
		return;
	}

	// Don't publish when we have no clients
	if (!canPublishToChannel('info')) {
		return;
	}

	const { json } = await modules.getApps();
	publish('info', 'UPDATED', json);
});

dee.listen();

// This needs to be fixed to run from events
setIntervalAsync(async () => {
	if (!canPublishToChannel('services')) {
		return;
	}

	// @todo: Create a system user for this
	const user = usersState.findOne({ name: 'root' });

	await run('services', 'UPDATED', {
		moduleToRun: modules.getServices,
		context: {
			user
		}
	});
}, 1000);

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 * @param resource The access-control permission resource to check against.
 */
const createSubscription = (channel, resource?) => ({
	subscribe(_, __, context) {
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

export const resolvers = {
	Query: {
		info: () => ({}),
		vms: () => ({}),
		server(name: string) {
			// Single server
			// return cache.get();
		},
		servers() {
			const mockData = [{
				online: true,
				info: {
					machineId: '38ed954556087cd0921d3ce69adaa57f',
					apps: {
						installed: 100,
						started: 1
					},
					versions: {
						unraid: '6.9.0-beta12'
					},
					os: {
						hostname: 'tower'
					}
				},
				array: {
					state: 'started',
					capacity: {
						bytes: {
							free: 1222900940800,
							total: 1347826987008,
							used: 124926046208
						}
					}
				},
				services: [
					{
					  name: 'emhttpd',
					  online: true,
					  version: null
					},
					{
					  name: 'rest-api',
					  online: false,
					  version: null
					},
					{
					  name: 'graphql-api',
					  online: true,
					  version: '2.4.9'
					},
					{
					  name: 'plugins',
					  online: null,
					  version: '1.1.5'
					}
				  ],
				  my_servers: {
					url: 'case-model.png',
					serverCase: 'custom'
				  }
			}];
			
			// All servers
			return userCache.get('mine');
			// return cache.data;
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
			subscribe: async (_, directiveArgs, context) => {
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