/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { pluginManager, pubsub, errors } from '../../../core';
import { hasSubscribedToChannel } from '../../../ws';
import { createSubscription, Context } from '../../schema/utils';

const { PluginError } = errors;

export const Subscription = {
	config: {
		...createSubscription('config')
	},
	display: {
		...createSubscription('display')
	},
	apikeys: {
		// Not sure how we're going to secure this
		// ...createSubscription('apikeys')
	},
	array: {
		...createSubscription('array')
	},
	// Devices: {
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
		// Subscribe: (_, __, context) => {
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
		...createSubscription('vms')
	},
	pluginModule: {
		subscribe: async (_: unknown, directiveArgs: {
			plugin: string;
			module: string;
		}, context: Context) => {
			const { plugin: pluginName, module: pluginModuleName } = directiveArgs;
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
	registration: {
		...createSubscription('registration')
	},
	online: {
		...createSubscription('online')
	},
	owner: {
		...createSubscription('owner')
	}
};
