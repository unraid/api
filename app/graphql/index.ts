/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { v4 as uuid } from 'uuid';
import * as core from '../core';
import { bus, apiManager, graphqlLogger, config, pluginManager, modules, coreLogger, log, paths, pubsub } from '../core';
import { AppError, FatalAppError, PluginError } from '../core/errors';
import { usersState } from '../core/states';
import dee from '@gridplus/docker-events';
import { run } from '../run';
import * as resolvers from './resolvers';
import { wsHasConnected, wsHasDisconnected } from '../ws';
import { MOTHERSHIP_RELAY_WS_LINK } from '../consts';
import { User } from '../core/types';
import { types as typeDefs } from './types';
import { schema } from './schema';

const internalServiceUser: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };

export const getCoreModule = (moduleName: string) => {
	if (!Object.keys(modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return modules[moduleName];
};

export const getPluginModule = (pluginName: string, pluginModuleName: string) => {
	if (!pluginManager.isInstalled(pluginName, pluginModuleName)) {
		throw new PluginError('Plugin not installed.');
	}

	if (!pluginManager.isActive(pluginName, pluginModuleName)) {
		throw new PluginError('Plugin disabled.');
	}

	if (!pluginModuleName) {
		return pluginManager.get(pluginName);
	}

	return pluginManager.get(pluginName, pluginModuleName);
};

// Ensure the provided API key is valid
const ensureApiKey = async (apiKeyToCheck: string) => {
	// If there's no my servers key loaded into memory then try to load it
	if (core.apiManager.getValidKeys().filter(key => key.name === 'my_servers').length === 0) {
		const configPath = paths.get('myservers-config')!;
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

const debug = config.get('debug');

export const apiKeyToUser = async (apiKey: string) => {
	try {
		await ensureApiKey(apiKey);
	} catch (error: unknown) {
		log.debug('Failed looking up API key with "%s"', (error as Error).message);

		return { name: 'guest', role: 'guest' };
	}

	try {
		const keyName = apiManager.getNameFromKey(apiKey);

		log.silly('Found key "%s".', keyName);

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
		log.debug('Failed looking up API key with "%s"', (error as Error).message);
	}

	return { id: -1, description: 'A guest user', name: 'guest', role: 'guest' };
};

// Update array values when slots change
bus.on('slots', async () => {
	coreLogger.silly('slots updated: running getArray');
	await run('array', 'UPDATED', {
		moduleToRun: modules.getArray,
		context: {
			user: internalServiceUser
		}
	});
});

let hostname: string;

// Update info/hostname when hostname changes
bus.on('var', async data => {
	// Publish var changes
	await pubsub.publish('vars', {
		vars: data.var.node
	});

	// Hostname changed
	if (hostname !== data.var.node.name) {
		// Update cache
		hostname = data.var.node.name;

		// Publish new hostname
		await pubsub.publish('info', {
			info: {
				os: {
					hostname
				}
			}
		});
	}
});

// On Docker event update info with { apps: { installed, started } }
log.debug('Loading docker events');
dee.on('*', async (data: { Type: 'container' | string; Action: 'start' | 'stop' | string; from: string }) => {
	log.debug(`[${data.from}] ${data.Type}->${data.Action}`);

	// Only listen to container events
	if (data.Type !== 'container') {
		return;
	}

	const user: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };
	const { json } = await modules.getAppCount({ user });
	await pubsub.publish('info', {
		info: {
			apps: json
		}
	});
});

dee.listen();

export const graphql = {
	debug,
	introspection: debug,
	playground: debug ? {
		subscriptionEndpoint: '/graphql'
	} : false,
	schema,
	types: typeDefs,
	resolvers,
	subscriptions: {
		keepAlive: 10000,
		onConnect: async (connectionParams: Record<string, string>) => {
			const apiKey = connectionParams['x-api-key'];
			const user = await apiKeyToUser(apiKey);
			const websocketId = uuid();

			graphqlLogger.debug(`<ws> ${user.name}[${websocketId}] connected.`);

			// Update ws connection count and other needed values
			wsHasConnected(websocketId);

			return {
				user,
				websocketId
			};
		},
		onDisconnect: async (_, websocketContext) => {
			const context = await websocketContext.initPromise;

			// This is the internal mothership connection
			// This should only disconnect if mothership restarts
			// or the network link reconnects
			if (websocketContext.socket.url === MOTHERSHIP_RELAY_WS_LINK) {
				graphqlLogger.debug('Mothership disconnected.');
				return;
			}

			// The websocket has disconnected before init event has resolved
			// @see: https://github.com/apollographql/subscriptions-transport-ws/issues/349
			if (context === true || context === false) {
				// This seems to also happen if a tab is left open and then a server starts up
				// The tab hits the server over and over again without sending init
				graphqlLogger.debug('<ws> unknown[unknown] disconnected.');
				return;
			}

			const { user, websocketId } = context as {
				user: {
					name: string;
				};
				websocketId: string;
			};
			graphqlLogger.debug(`<ws> ${user.name}[${websocketId}] disconnected.`);

			// Update ws connection count and other needed values
			wsHasDisconnected(websocketId);
		}
	},
	context: async ({ req, connection }) => {
		// Normal Websocket connection
		if (connection && Object.keys(connection.context).length >= 1) {
			// Check connection for metadata
			return {
				...connection.context
			};
		}

		// Normal HTTP connection
		if (req) {
			const apiKey = req.headers['x-api-key'];
			const user = await apiKeyToUser(apiKey);

			return {
				user
			};
		}

		throw new Error('Invalid API key');
	}
};
