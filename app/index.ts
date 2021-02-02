/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import os from 'os';
import am from 'am';
import * as Sentry from '@sentry/node';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { core, states, coreLogger, log } from './core';
import { server } from './server';
import { apiManager } from './core';
import { InternalGraphql, MothershipSocket } from './mothership';

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
	// Load core
	await core.load();

	// Let's try and load the HTTP server
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

	// Load nchan
	await core.loadNchan();

	const sockets = new Map<string, MothershipSocket | InternalGraphql>();
	let lastknownApiKey: string;

	// If key is removed then disconnect our sockets
	apiManager.on('expire', async name => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			await sockets.get('relay')?.disconnect();
			await sockets.get('internalGraphql')?.disconnect();
		} catch (error: unknown) {
			log.error('Failed updating sockets on apiKey "expire" event with error %s.', error);
		}
	});

	// If the key changes try to (re)connect to Mothership
	apiManager.on('replace', async (name, newApiKey) => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			// If we're missing our sockets let's create them
			if (!sockets.has('relay') || !sockets.has('internalGraphql')) {
				sockets.set('relay', new MothershipSocket({ apiKey: lastknownApiKey }));
				sockets.set('internalGraphql', new InternalGraphql({ apiKey: lastknownApiKey }));
				return;
			}

			// If the key is the same as the one we're already connected with ignore it.
			if (newApiKey === lastknownApiKey) {
				return;
			}

			// Let's reconnect all sockets
			await sockets.get('relay')?.reconnect();
			await sockets.get('internalGraphql')?.reconnect();
		} catch (error: unknown) {
			log.error('Failed updating sockets on apiKey "replace" event with error %s.', error);
		}
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
