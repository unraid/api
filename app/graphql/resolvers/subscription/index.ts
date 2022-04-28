/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { GraphQLResolveInfo } from 'graphql';
import { AppError } from '../../../core/errors/app-error';
import { pubsub } from '../../../core/pubsub';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { hasSubscribedToChannel } from '../../../ws';
import { createSubscription } from '../../schema/utils';

let mothershipProducer: NodeJS.Timer;
const publishToMothership = async () => {
	await pubsub.publish('mothership', {
		mothership: {}
	});
};

const stopMothershipProducer = () => {
	// Clear last producer
	if (mothershipProducer) clearInterval(mothershipProducer);
};

const startMothershipProducer = () => {
	stopMothershipProducer();

	// Start new producer
	mothershipProducer = setInterval(async () => {
		await publishToMothership();
	}, 5_000);
};

export function withCancel<T>(
	asyncIterator: AsyncIterator<T | undefined>,
	onCancel: () => void
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
	},
	mothership: {
		subscribe: async (rootValue, args, context, info: GraphQLResolveInfo) => {
			if (!context.user) {
				throw new AppError('<ws> No user found in context.', 500);
			}

			// Check the user has permission to subscribe to this endpoint
			ensurePermission(context.user, {
				resource: 'mothership',
				action: 'read',
				possession: 'any'
			});

			// Mark channel as subscribed
			hasSubscribedToChannel(context.websocketId, 'mothership');

			// Start producer
			startMothershipProducer();

			// Return iterator with a cancel method that'll stop the producer
			const iterator = pubsub.asyncIterator('mothership');
			return withCancel(iterator, async () => {
				stopMothershipProducer();
			});
		}
	}
};
