/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { v4 as randomUUID } from 'uuid';
import * as core from '@app/core';
import { AppError } from '@app/core/errors/app-error';
import { FatalAppError } from '@app/core/errors/fatal-error';
import { usersState } from '@app/core/states';
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
import { paths } from '@app/core/paths';
import { pubsub } from '@app/core/pubsub';
import { apiManager } from '@app/core/api-manager';

const internalServiceUser: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };

export const getCoreModule = (moduleName: string) => {
	if (!Object.keys(modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return modules[moduleName];
};

// Ensure the provided API key is valid
const ensureApiKey = async (apiKeyToCheck: string) => {
	// If there's no my servers key loaded into memory then try to load it
	if (core.apiManager.getValidKeys().filter(key => key.name === 'my_servers').length === 0) {
		const configPath = paths['myservers-config'];
		await apiManager.checkKey(configPath, true);
	}

	// Check there are any valid keys then check if the key given is valid
	// If my_servers wasn't loaded before the function above should have fixed that
	if (core.apiManager.getValidKeys().length >= 1) {
		// API manager has keys but we didn't give one to check
		if (!apiKeyToCheck) {
			throw new AppError('Missing API key.', 403);
		}

		// API manger has keys but the key we gave isn't valid
		if (!apiManager.isValid(apiKeyToCheck)) {
			throw new AppError('Invalid API key.', 403);
		}
	} else if (process.env.NODE_ENV !== 'development') {
		// API manager has no keys
		// This is skipped in development
		throw new AppError('No valid API keys active.', 401);
	}
};

export const apiKeyToUser = async (apiKey: string) => {
	try {
		await ensureApiKey(apiKey);
	} catch (error: unknown) {
		graphqlLogger.debug('Failed looking up API key with "%s"', (error as Error).message);

		return { name: 'guest', role: 'guest' };
	}

	try {
		const keyName = apiManager.getNameFromKey(apiKey);

		graphqlLogger.trace('Found key "%s".', keyName);

		// Force upc into it's own group that's not a user group
		if (keyName && keyName === 'upc') {
			return { id: -1, description: 'UPC service account', name: 'upc', role: 'upc' };
		}

		// Force notifier into it's own group that's not a user group
		if (keyName && keyName === 'notifier') {
			return { id: -1, description: 'Notifier service account', name: 'notifier', role: 'notifier' };
		}

		// Force my_servers into it's own group that's not a user group
		if (keyName && keyName === 'my_servers') {
			return { id: -1, description: 'My servers service account', name: 'my_servers', role: 'my_servers' };
		}

		if (keyName) {
			const id = apiManager.getKey(keyName)?.userId;
			const foundUser = usersState.findOne({ id });
			if (foundUser) {
				return foundUser;
			}
		}
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
		keepAlive: 10000,
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
