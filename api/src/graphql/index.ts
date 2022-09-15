/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { v4 as randomUUID } from 'uuid';
import { FatalAppError } from '@app/core/errors/fatal-error';
import { DockerEventEmitter } from '@gridplus/docker-events';
import { run } from '@app/run';
import * as resolvers from '@app/graphql/resolvers';
import { wsHasConnected, wsHasDisconnected } from '@app/ws';
import { User } from '@app/core/types';
import { types as typeDefs } from '@app/graphql/types';
import { schema } from '@app/graphql/schema';
import { dockerLogger, graphqlLogger, logger } from '@app/core/log';
import { modules } from '@app/core';
import { bus } from '@app/core/bus';
import { config } from '@app/core/config';
import { pubsub } from '@app/core/pubsub';
import { getters } from '@app/store';

const internalServiceUser: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };

export const getCoreModule = (moduleName: string) => {
	if (!Object.keys(modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return modules[moduleName];
};

export const apiKeyToUser = async (apiKey: string) => {
	try {
		const config = getters.config();
		if (apiKey === config.remote.apikey) return { id: -1, description: 'My servers service account', name: 'my_servers', role: 'my_servers' };
		if (apiKey === config.upc.apikey) return { id: -1, description: 'UPC service account', name: 'upc', role: 'upc' };
		if (apiKey === config.notifier.apikey) return { id: -1, description: 'Notifier service account', name: 'notifier', role: 'notifier' };
	} catch (error: unknown) {
		graphqlLogger.debug('Failed looking up API key with "%s"', (error as Error).message);
	}

	return { id: -1, description: 'A guest user', name: 'guest', role: 'guest' };
};

// Update array values when slots change
bus.on('slots', async () => {
	dockerLogger.trace('slots updated: running getArray');
	await run('array', 'UPDATED', {
		moduleToRun: modules.getArray,
		context: {
			user: internalServiceUser,
		},
	});
});

let hostname: string;

// Update info/hostname when hostname changes
bus.on('var', async data => {
	// Publish var changes
	await pubsub.publish('vars', {
		vars: data.var.node,
	});

	// Hostname changed
	if (hostname !== data.var.node.name) {
		// Update cache
		hostname = data.var.node.name;

		// Publish new hostname
		await pubsub.publish('info', {
			info: {
				os: {
					hostname,
				},
			},
		});
	}
});

// Only watch container events equal to start/stop
const watchedEvents = [
	'die',
	'kill',
	'oom',
	'pause',
	'restart',
	'start',
	'stop',
	'unpause',
].map(event => `event=${event}`);

// Create docker event emitter instance
logger.addContext('events', watchedEvents);
logger.debug('Creating docker event emitter instance');
logger.removeContext('events');
const dee = new DockerEventEmitter(watchedEvents);

// On Docker event update info with { apps: { installed, started } }
dee.on('*', async (data: { Type: 'container'; Action: 'start' | 'stop'; from: string }) => {
	// Only listen to container events
	if (data.Type !== 'container') {
		dockerLogger.debug(`[${data.Type as string}] ${data.from} ${data.Action}`);
		return;
	}

	dockerLogger.addContext('data', data);
	dockerLogger.debug(`[${data.from}] ${data.Type}->${data.Action}`);
	dockerLogger.removeContext('data');

	const user: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };
	const { json } = await modules.getAppCount({ user });
	await pubsub.publish('info', {
		info: {
			apps: json,
		},
	});
});

logger.debug('Binding to docker events');
dee.listen();

export const graphql = {
	debug: config.debug,
	introspection: (process.env.INTROSPECTION ?? config.debug),
	playground: (process.env.PLAYGROUND ?? config.debug) ? {
		subscriptionEndpoint: '/graphql',
	} : false,
	schema,
	types: typeDefs,
	resolvers,
	subscriptions: {
		keepAlive: 10_000,
		async onConnect(connectionParams: Record<string, string>) {
			const apiKey = connectionParams['x-api-key'];
			const user = await apiKeyToUser(apiKey);
			const websocketId = randomUUID();

			graphqlLogger.addContext('websocketId', websocketId);
			graphqlLogger.debug('%s connected', user.name);
			graphqlLogger.removeContext('websocketId');

			// Update ws connection count and other needed values
			wsHasConnected(websocketId);

			return {
				user,
				websocketId,
			};
		},
		async onDisconnect(_, websocketContext: {
			initPromise: Promise<boolean | {
				user: {
					name: string;
				};
				websocketId: string;
			}>;
		}) {
			const context = await websocketContext.initPromise;

			// The websocket has disconnected before init event has resolved
			// @see: https://github.com/apollographql/subscriptions-transport-ws/issues/349
			if (context === true || context === false) {
				// This seems to also happen if a tab is left open and then a server starts up
				// The tab hits the server over and over again without sending init
				graphqlLogger.debug('unknown disconnected');
				return;
			}

			const { user, websocketId } = context;

			graphqlLogger.addContext('websocketId', websocketId);
			graphqlLogger.debug('%s disconnected.', user.name);
			graphqlLogger.removeContext('websocketId');

			// Update ws connection count and other needed values
			wsHasDisconnected(websocketId);
		},
	},
	async context({ req, connection }: { req: { headers: Record<string, string> }; connection: { context: Record<string, unknown> } }) {
		// Normal Websocket connection
		if (connection && Object.keys(connection.context).length >= 1) {
			// Check connection for metadata
			return {
				...connection.context,
			};
		}

		// Normal HTTP connection
		if (req) {
			const apiKey = req.headers['x-api-key'];
			const user = await apiKeyToUser(apiKey);

			return {
				user,
			};
		}

		throw new Error('Invalid API key');
	},
};
