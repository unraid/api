/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import cors from 'cors';
import { watch } from 'chokidar';
import express, { json, type Request, type Response } from 'express';
import http from 'http';
import type WebSocket from 'ws';
import {
	ApolloServerPluginLandingPageGraphQLPlayground,
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { logger, config, pubsub, graphqlLogger } from '@app/core';
import { verifyTwoFactorToken } from '@app/common/two-factor';
import display from '@app/graphql/resolvers/query/display';
import { getEndpoints } from '@app/core/utils/misc/get-endpoints';
import { getters } from '@app/store';
import { schema } from '@app/graphql/schema';
import { execute, subscribe } from 'graphql';
import { type ConnectionContext, SubscriptionServer } from 'subscriptions-transport-ws';
import { wsHasConnected, wsHasDisconnected } from '@app/ws';
import { apiKeyToUser } from '@app/graphql';
import { randomUUID } from 'crypto';
import { getServerAddress } from '@app/common/get-server-address';
import { apolloConfig } from '@app/graphql/config';
import { originMiddleware } from '@app/originMiddleware';
import { API_VERSION } from '@app/environment';
import { getBannerPathIfPresent, getCasePathIfPresent } from '@app/core/utils/images/image-file-helpers';

const configFilePath = path.join(getters.paths()['dynamix-base'], 'case-model.cfg');
const customImageFilePath = path.join(getters.paths()['dynamix-base'], 'case-model.png');

const updatePubsub = async () => {
	await pubsub.publish('display', {
		display: await display(),
	});
};

// Update pub/sub when config/image file is added/updated/removed
watch(configFilePath).on('all', updatePubsub);
watch(customImageFilePath).on('all', updatePubsub);

/**
 * The webserver.
 */
export const app = express();

// Ensure json bodies can be parsed
app.use(json());

// Cors
app.use(cors());
app.use(originMiddleware);

// Add Unraid API version header
app.use(async (_req, res, next) => {
	// Only get the machine ID on first request
	// We do this to avoid using async in the main server function
	if (!app.get('x-unraid-api-version')) {
		app.set('x-unraid-api-version', API_VERSION);
	}

	// Update header with unraid API version
	res.set('x-unraid-api-version', app.get('x-unraid-api-version'));

	next();
});

export const httpServer = http.createServer(app);

// Log only if the server actually binds to the port
httpServer.on('listening', () => {
	logger.info('Server is up! %s', getServerAddress(httpServer));
});

// This needs to be a let as it's referenced before it's used
// eslint-disable-next-line prefer-const
let subscriptionServer: SubscriptionServer;

const apolloServerPluginOnExit = {
	async serverWillStart() {
		return {
			/**
			 * When the app exits this will be run.
			 */
			async drainServer() {
				// Close all connections to subscriptions server
				subscriptionServer.close();
			},
		};
	},
};

// Create graphql instance
export const server = new ApolloServer({
	...apolloConfig,
	plugins: [
		apolloServerPluginOnExit,
		// eslint-disable-next-line new-cap
		(process.env.PLAYGROUND ?? config.debug) ? ApolloServerPluginLandingPageGraphQLPlayground() : ApolloServerPluginLandingPageDisabled(),
		// Close all connections to http server when the app closes
		// eslint-disable-next-line new-cap
		ApolloServerPluginDrainHttpServer({ httpServer }),
	],
});

subscriptionServer = SubscriptionServer.create({
	// This is the `schema` we just created.
	schema,
	// These are imported from `graphql`.
	execute,
	subscribe,
	// Ensure keep-alive packets are sent
	keepAlive: 10_000,
	// This `server` is the instance returned from `new ApolloServer`.
	// Ensures the same graphql validation rules are applied to both the Subscription Server and the ApolloServer
	validationRules: server.requestOptions.validationRules,
	// Providing `onConnect` is the `SubscriptionServer` equivalent to the
	// `context` function in `ApolloServer`. Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
	// for more information on this hook.
	async onConnect(
		connectionParams: {'x-api-key': string },
	) {
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
}, {
	// This is the `httpServer` we created in a previous step.
	server: httpServer,
	// This `server` is the instance returned from `new ApolloServer`.
	path: server.graphqlPath,
});

// List all endpoints at start of server
app.get('/', (_, res) => res.send(getEndpoints(app)));

app.post('/verify', async (req, res) => {
	try {
		// Check two-factor token is valid
		verifyTwoFactorToken(req.body?.username, req.body?.token);

		// Success
		logger.debug('2FA token valid, allowing login.');

		// Allow the user to pass
		res.sendStatus(204);
		return;
	} catch (error: unknown) {
		logger.addContext('error', error);
		logger.error('Failed validating 2FA token.');
		logger.removeContext('error');

		// User failed verification
		res.status(401);
		res.send((error as Error).message);
	}
});

app.get('/graphql/api/customizations/:type', async (req: Request, res: Response) => {
	// @TODO - Clean up this function
	const apiKey = req.headers['x-api-key'];
	if (apiKey && typeof apiKey === 'string' && (await apiKeyToUser(apiKey)).role !== 'guest') {
		if (req.params.type === 'banner') {
			const path = await getBannerPathIfPresent();
			if (path) {
				res.sendFile(path);
				return;
			}
		} else if (req.params.type === 'case') {
			const path = await getCasePathIfPresent();
			if (path) {
				res.sendFile(path);
				return;
			}
		}

		return res.status(404).send('no customization of this type found');
	}

	return res.status(403).send('unauthorized');
});

// Handle errors by logging them and returning a 500.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error & { stackTrace?: string; status?: number }, _, res: Response, __) => {
	// Don't log CORS errors
	if (error.message.includes('CORS')) return;

	logger.error(error);

	if (error.stack) {
		error.stackTrace = error.stack;
	}

	res.status(error.status ?? 500).send(error);
});
