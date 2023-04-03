/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { type Resolvers } from '@app/graphql/generated/api/types';
import { createSubscription } from '@app/graphql/schema/utils';

export function withCancel<T>(
	asyncIterator: AsyncIterator<T | undefined>,
	onCancel: () => void,
): AsyncIterator<T | undefined> {
	if (!asyncIterator.return) {
		asyncIterator.return = async () => Promise.resolve({ value: undefined, done: true });
	}

	const savedReturn = asyncIterator.return.bind(asyncIterator);
	asyncIterator.return = async () => {
		onCancel();
		return savedReturn();
	};

	return asyncIterator;
}

export const Subscription: Resolvers['Subscription'] = {
	display: {
		...createSubscription('display'),
	},
	apikeys: {
		// Not sure how we're going to secure this
		// ...createSubscription('apikeys')
	},
	config: {
		...createSubscription('config'),
	},
	array: {
		...createSubscription('array'),
	},
	dockerContainers: {
		...createSubscription('docker/container'),
	},
	dockerNetworks: {
		...createSubscription('docker/network'),
	},
	info: {
		...createSubscription('info'),
	},
	servers: {
		...createSubscription('servers'),
	},
	shares: {
		...createSubscription('shares'),
	},
	unassignedDevices: {
		...createSubscription('devices/unassigned'),
	},
	users: {
		...createSubscription('users'),
	},
	vars: {
		...createSubscription('vars'),
	},
	vms: {
		...createSubscription('vms'),
	},
	registration: {
		...createSubscription('registration'),
	},
	online: {
		...createSubscription('online'),
	},
	owner: {
		...createSubscription('owner'),
	},
};
