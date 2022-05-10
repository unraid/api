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
import { dashboardLogger } from '../../../core/log';
import { config } from '../../../core/config';
import { generateData } from '../../../common/dashboard/generate-data';

let dashboardProducer: NodeJS.Timer | undefined;
const publishToDashboard = async () => {
	try {
		const dashboard = await generateData();
		await pubsub.publish('dashboard', {
			dashboard
		});
	} catch (error: unknown) {
		dashboardLogger.error('Failed publishing');
		if (config.debug) dashboardLogger.error(error);
	}
};

let connectedToDashboard = 0;

const stopDashboardProducer = () => {
	// Don't stop if we still have clients using this
	if (connectedToDashboard >= 1) return;

	// Stop dashboard producer
	if (dashboardProducer) {
		dashboardLogger.debug('Stopping dashboard producer');
		clearInterval(dashboardProducer);
		dashboardProducer = undefined;
	}
};

const startDashboardProducer = () => {
	// Don't start twice
	if (dashboardProducer) return;

	// Start new producer
	dashboardLogger.debug('Starting dashboard producer');
	dashboardProducer = setInterval(async () => {
		dashboardLogger.debug('Publishing');
		await publishToDashboard();
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
	dashboard: {
		subscribe: async (rootValue, args, context, info: GraphQLResolveInfo) => {
			if (!context.user) {
				throw new AppError('<ws> No user found in context.', 500);
			}

			// Check the user has permission to subscribe to this endpoint
			ensurePermission(context.user, {
				resource: 'dashboard',
				action: 'read',
				possession: 'any'
			});

			// Mark channel as subscribed
			hasSubscribedToChannel(context.websocketId, 'dashboard');

			// Increase the connected count
			connectedToDashboard++;

			// Start producer
			startDashboardProducer();

			// Return iterator with a cancel method that'll stop the producer
			const iterator = pubsub.asyncIterator('dashboard');
			return withCancel(iterator, async () => {
				connectedToDashboard--;
				stopDashboardProducer();
			});
		}
	}
};
