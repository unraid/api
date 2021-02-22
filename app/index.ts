/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import os from 'os';
import am from 'am';
import * as Sentry from '@sentry/node';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { core, states, coreLogger, log, apiManager } from './core';
import { server } from './server';
import { InternalGraphql, MothershipSocket } from './mothership';
import { sockets } from './sockets';
import { sleep } from './core/utils';

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
	let lastknownApiKey: string;
	const apiManagerLogger = log.createChild({
		prefix: 'api-manager'
	});

	// Load core
	await core.load();

	// Try and load the HTTP server
	coreLogger.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		coreLogger.info('Server is up! %s', getServerAddress(server.server));
	});

	// Trying to start server
	await server.start().catch(error => {
		log.error(error);

		// On process exit
		exitHook(async () => {
			coreLogger.debug('Stopping HTTP server');

			// Stop the server
			server.stop();
		});
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
			await sockets.get('relay')?.disconnect();

			// Disconnect internal graphql
			apiManagerLogger.debug('Disconnecting internalGraphql');
			await sockets.get('internalGraphql')?.disconnect();
		} catch (error: unknown) {
			apiManagerLogger.error('Failed updating sockets on apiKey "expire" event with error %s.', error);
		}
	});

	// If the key changes try to (re)connect to Mothership
	// The internal graphql check needs to be done
	// first so it'll be up before relay connects
	apiManager.on('replace', async (name, newApiKey) => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			// If either socket is missing let's connect them
			if (!sockets.has('internalGraphql') || !sockets.has('relay')) {
				// Create internal graphql socket if it's missing
				if (!sockets.has('internalGraphql')) {
					// If the graphql server has no address it's likely still
					// starting up so let's wait so we don't hit a 1006 error
					if (server.server.address() !== null) {
						apiManagerLogger.debug('Internal graphql isn\'t started, waiting 2s');
						await sleep(2000);
					}

					// Create internal graphql socket
					apiManagerLogger.debug('Creating internal graphql socket');
					sockets.set('internalGraphql', new InternalGraphql({ apiKey: lastknownApiKey }));
				}

				// Create relay socket if it's missing
				if (!sockets.has('relay')) {
					// Create relay socket
					apiManagerLogger.debug('Creating relay socket');
					sockets.set('relay', new MothershipSocket({ apiKey: lastknownApiKey }));
				}

				return;
			}

			// Ignore this key if it's the same as our current key.
			if (newApiKey === lastknownApiKey) {
				apiManagerLogger.debug('API key has\'t changed');
				return;
			}

			// Let's reconnect all sockets
			await sockets.get('relay')?.reconnect();
			await sockets.get('internalGraphql')?.reconnect();
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
