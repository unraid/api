/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { createSubscription } from '../../schema/utils';

export const Subscription = {
	display: {
		...createSubscription('display')
	},
	apikeys: {
		// Not sure how we're going to secure this
		// ...createSubscription('apikeys')
	},
	config: {
		...createSubscription('config')
	},
	array: {
		...createSubscription('array')
	},
	dockerContainers: {
		...createSubscription('docker/container')
	},
	dockerNetworks: {
		...createSubscription('docker/network')
	},
	info: {
		...createSubscription('info')
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
