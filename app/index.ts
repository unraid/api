/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import os from 'os';
import am from 'am';
import * as Sentry from '@sentry/node';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { core, states, coreLogger, log, apiManager, apiManagerLogger } from './core';
import { server } from './server';
import { InternalGraphql, MothershipSocket } from './mothership';
import { sockets } from './sockets';
import { mothership } from './mothership/subscribe-to-servers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json') as { version: string };

// Send errors to server if enabled
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 1.0,
	release: `unraid-api@${version}`,
	environment: process.env.ENVIRONMENT ?? 'unknown',
	serverName: os.hostname(),
	enabled: Boolean(process.env.SENTRY_DSN)
});

// Set user's ID to their flashGuid
Sentry.setUser({
	id: states.varState.data.flashGuid
});

// Boot app
am(async () => {
	let lastKnownApiKey: string;

	// Load core
	await core.load();

	// Try and load the HTTP server
	coreLogger.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		coreLogger.info('Server is up! %s', getServerAddress(server.server));
	});

	// It has it's first keys loaded
	apiManager.on('ready', async () => {
		try {
			// Try to start server
			await server.start().catch(error => {
				log.error(error);

				// On process exit
				exitHook(async () => {
					coreLogger.debug('Stopping HTTP server');

					// Stop the server
					server.stop();
				});
			});

			// Get newest API key
			const apiKey = apiManager.getKey('my_servers');

			// We're ready but they're not logged into myservers yet
			if (!apiKey) {
				return;
			}

			// Make note of API key
			lastKnownApiKey = apiKey.key;

			// Create internal graphql socket
			coreLogger.debug('Creating internal graphql socket');
			const internalGraphqlSocket = new InternalGraphql({ lazy: true });
			sockets.set('internalGraphql', internalGraphqlSocket);

			// Create relay socket
			coreLogger.debug('Creating relay socket');
			const relaySocket = new MothershipSocket({ lazy: true });
			sockets.set('relay', relaySocket);

			// Connect sockets
			await Promise.all([
				internalGraphqlSocket.connect(),
				relaySocket.connect()
			]);
		} catch (error: unknown) {
			coreLogger.error('Failed creating sockets on "ready" event with error %s.', (error as Error).message);
		}
	});

	// If key is removed then disconnect our sockets
	apiManager.on('expire', async name => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			// Disconnect relay
			apiManagerLogger.debug('Disconnecting relay');
			await sockets.get('relay')?.disconnect(4401);

			// Disconnect internal graphql
			apiManagerLogger.debug('Disconnecting internalGraphql');
			await sockets.get('internalGraphql')?.disconnect(4401);
		} catch (error: unknown) {
			apiManagerLogger.error('Failed updating sockets on "expire" event with error %s.', error);
		}
	});

	// If the key changes try to (re)connect to Mothership
	// The internal graphql check needs to be done
	// first so it'll be up before relay connects
	apiManager.on('replace', async (name, keyEntry) => {
		try {
			// Get key in string format
			const newApiKey = keyEntry.key;

			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			// Ignore this key if it's the same as our current key.
			if (newApiKey === lastKnownApiKey) {
				apiManagerLogger.debug('API key has\'t changed');
				return;
			}

			apiManagerLogger.debug('Replacing my_servers key. Last known key was %s. New key is %s', lastKnownApiKey, newApiKey);

			// Make note of API key
			lastKnownApiKey = newApiKey;

			// Let's connect all sockets
			await sockets.get('relay')?.connect();
			await sockets.get('internalGraphql')?.connect();

			// Reconnect subscriptions if we now have a valid key
			if (newApiKey) {
				coreLogger.debug('Connecting to mothership\'s subscription endpoint.');

				// Connect to the subscription endpoint
				mothership.tryReconnect();
			} else {
				// Disconnect forcefully from mothership's subscription endpoint so we ensure it doesn't reconnect automatically
				mothership.close();
				coreLogger.debug('Disconnected from mothership\'s subscription endpoint.');
			}
		} catch (error: unknown) {
			apiManagerLogger.error('Failed updating sockets on apiKey "replace" event with error %s.', error);
		}
	});

	// Load nchan
	core.loadNchan().catch(error => {
		log.error(error);
	});
}, async (error: NodeJS.ErrnoException) => {
	// Send error to server for debugging
	Sentry.captureException(error);

	// Stop server
	server.stop(async () => {
		/**
		 * Flush messages to server before stopping.
		 *
		 * This may mean waiting up to 5s
		 * before the server actually stops.
		 */
		await Sentry.flush(5000);

		// Kill application
		process.exit(1);
	});
});
