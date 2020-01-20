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

const { pluginManager, pubsub, utils, log, bus, errors } = core;
const { PluginError } = errors;

// Send test message every 1 second for 10 seconds.
const startPing = async (interval = 1000, total = 10) => {
	await run('ping', 'UPDATED', {
		node: 'PONG!',
		interval,
		total
	});
};

// Receive test messages.
// pubsub.subscribe('ping', (...rest) => {
// 	console.log(`CHANNEL: ping DATA: ${JSON.stringify(rest, null, 2)}`);
// });

// Update array values when disks change
bus.on('disks', async () => {
	await run('array', 'UPDATED', {
		moduleToRun: core.modules.getArray,
		context: {}
	});
});

const createBasicSubscription = name => ({
	subscribe: async () => {
		return pubsub.asyncIterator(name);
	}
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

// Republish bus events to pubsub when clients connect
// We need to filter to only the endpoint that're currently connected
// bus.on('*', (...args) => {
// 	if (!canPublishToClients()) {
// 		return;
// 	}

// 	const {
// 		[args.length - 1]: last,
// 		...rest
// 	} = args;

// 	pubsub.publish(...Object.values(rest));
// });

// This needs to be fixed to run from events
setIntervalAsync(async () => {
	if (!canPublishToClients()) {
		return;
	}

	await run('services', 'UPDATED', {
		moduleToRun: core.modules.getServices
	});
}, 1000);

export const resolvers = {
	Query: {
		info: () => ({}),
		vms: () => ({})
	},
	Subscription: {
		apikeys: {
			// Not sure how we're going to secure this
			...createBasicSubscription('apikeys')
		},
		array: {
			...createBasicSubscription('array')
		},
		devices: {
			...createBasicSubscription('devices')
		},
		dockerContainers: {
			...createBasicSubscription('docker/containers')
		},
		dockerNetworks: {
			...createBasicSubscription('docker/networks')
		},
		info: {
			...createBasicSubscription('info')
		},
		ping: {
			subscribe: () => {
				startPing();
				return pubsub.asyncIterator('ping');
			}
		},
		services: {
			...createBasicSubscription('services')
		},
		shares: {
			...createBasicSubscription('shares')
		},
		unassignedDevices: {
			...createBasicSubscription('devices/unassigned')
		},
		users: {
			...createBasicSubscription('users')
		},
		vars: {
			...createBasicSubscription('vars')
		},
		vms: {
			...createBasicSubscription('vms/domains')
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