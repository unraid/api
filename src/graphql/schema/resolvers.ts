/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import core from '@unraid/core';
// @ts-ignore
// import * as core from '../../../../core/src/index';
import dee from '@gridplus/docker-events';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import GraphQLJSON from 'graphql-type-json';
import GraphQLLong from 'graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import { run, canPublishToClients, updatePubsub } from '../../run';

const { pluginManager, pubsub, utils, log, bus, errors, states } = core;
const { ensurePermission } = utils;
const { usersState } = states;
const { AppError, PluginError } = errors;

// Update array values when disks change
bus.on('disks', async () => {
	// @todo: Create a system user for this
	const user = usersState.findOne({ name: 'root' });

	await run('array', 'UPDATED', {
		moduleToRun: core.modules.getArray,
		context: {
			user
		}
	});
});

// On Docker event update info with { apps: { installed, started } }
const updatePubsubWithDockerEvent = async () => {
	if (!canPublishToClients()) {
		return;
	}

	const { json } = await core.modules.getApps();
	updatePubsub('info', 'UPDATED', json);
};

dee.on('start', updatePubsubWithDockerEvent);
dee.on('stop', updatePubsubWithDockerEvent);

dee.listen();

// This needs to be fixed to run from events
setIntervalAsync(async () => {
	if (!canPublishToClients()) {
		return;
	}

	// @todo: Create a system user for this
	const user = usersState.findOne({ name: 'root' });

	await run('services', 'UPDATED', {
		moduleToRun: core.modules.getServices,
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
			throw new AppError('<ws> No user found in context.');
		}

		// Check the user has permissison to subscribe to this endpoint
		ensurePermission(context.user, {
			resource: resource || channel,
			action: 'read',
			possession: 'any'
		});

		return pubsub.asyncIterator(channel);
	}
});

export const resolvers = {
	Query: {
		info: () => ({}),
		vms: () => ({})
	},
	Subscription: {
		apikeys: {
			// Not sure how we're going to secure this
			...createSubscription('apikeys')
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
			// subscribe: () => {
			// 	// startPing();
			// 	return pubsub.asyncIterator('ping');
			// }
		},
		services: {
			...createSubscription('services')
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
			subscribe: async (_, directiveArgs) => {
				const {plugin: pluginName, module: pluginModuleName} = directiveArgs;
				const name = `${pluginName}/${pluginModuleName}`;

				// Verify plugin is installed and active
				if (!pluginManager.isInstalled(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin not installed.');
				}

				if (!pluginManager.isActive(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin disabled.');
				}

				// It's up to the plugin to publish new data as needed
				// so we'll just return the Iterator
				return pubsub.asyncIterator(name);
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