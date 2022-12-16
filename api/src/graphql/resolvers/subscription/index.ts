/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { type GraphQLResolveInfo } from 'graphql';
import { AppError } from '@app/core/errors/app-error';
import { pubsub } from '@app/core/pubsub';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { hasSubscribedToChannel } from '@app/ws';
import { createSubscription } from '@app/graphql/schema/utils';
import { store } from '@app/store';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';

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

export const Subscription = {
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
	services: {
		...createSubscription('services'),
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
	dashboard: {
		async subscribe(rootValue, args, context, _: GraphQLResolveInfo) {
			if (!context.user) {
				throw new AppError('<ws> No user found in context.', 500);
			}

			// Check the user has permission to subscribe to this endpoint
			ensurePermission(context.user, {
				resource: 'dashboard',
				action: 'read',
				possession: 'any',
			});

			// Mark channel as subscribed
			hasSubscribedToChannel(context.websocketId, 'dashboard');

			// Start producer
			store.dispatch(startDashboardProducer());

			// Return iterator with a cancel method that'll stop the producer
			const iterator = pubsub.asyncIterator('dashboard');
			return withCancel(iterator, async () => {
				// Stop producer
				store.dispatch(stopDashboardProducer());
			});
		},
	},
};
