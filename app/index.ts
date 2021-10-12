/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import os from 'os';
import am from 'am';
import * as Sentry from '@sentry/node';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { Serializer as IniSerializer } from 'multi-ini';
import { core, states, coreLogger, log, apiManager, apiManagerLogger, logger, paths } from './core';
import { server } from './server';
import { mothership } from './mothership/subscribe-to-servers';
import { startInternal, sockets } from './mothership';
import { loadState, sleep } from './core/utils';
import { version } from '../package.json';

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

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false
});

// Boot app
am(async () => {
	let lastKnownApiKey: string | undefined;

	// Get my server's config file path
	const configPath = paths.get('myservers-config')!;

	const myserversConfigFile = loadState<{
		api?: { version: string };
	}>(configPath);

	// Write API version to myservers.cfg if changed
	if (myserversConfigFile?.api?.version !== version) {
		const data = {
			...myserversConfigFile,
			api: {
				version
			}
		};
	
		// Stringify data
		const stringifiedData = serializer.serialize(data);
	
		// Update config file
		fs.writeFileSync(configPath, stringifiedData);
		log.debug('Wrote API version to MyServers config file');
	}

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

			log.debug('API key removed from cfg, closing connection to relay.');

			// Disconnect internal
			sockets.internal?.close();

			// Disconnect relay
			sockets.relay?.close();
		} catch (error: unknown) {
			apiManagerLogger.error('Failed updating sockets on "expire" event with error %s.', error);
		}
	});

	let hasFirstKey = false;

	// If the key changes try to (re)connect to Mothership
	// The internal graphql check needs to be done
	// first so it'll be up before relay connects
	apiManager.on('replace', async (name, keyEntry) => {
		try {
			// Get key in string format
			const newApiKey: string = keyEntry.key;

			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			// Ignore this key if it's the same as our current key.
			if (newApiKey === lastKnownApiKey) {
				apiManagerLogger.debug('API key has\'t changed');
				return;
			}

			// Disconnect from relay
			sockets.relay?.close();
			coreLogger.debug('Disconnected from relay ws.');

			// Disconnect from internal ws
			sockets.internal?.close();
			coreLogger.debug('Disconnected from internal ws.');

			// Disconnect from mothership's subscription endpoint
			mothership.close();
			coreLogger.debug('Disconnected from mothership\'s subscription endpoint.');

			// Since we no longer have a key and
			// everything is disconnected we can bail
			if (newApiKey === undefined) {
				apiManagerLogger.debug('Cleared my_servers key.');
				return;
			}

			// We've never had a key before so let's start the internal API connection
			// That'll then start the relay connection to mothership
			if (!hasFirstKey && lastKnownApiKey === undefined) {
				coreLogger.debug('First time with a valid API key, waiting 5s to connect.');
				// Wait 5s for the API to come up before connecting
				setTimeout(() => {
					coreLogger.debug('Connecting to internal for the first time.');
					// Start the internal relay connection
					// This will connect to relay once it's up
					startInternal(newApiKey);
				}, 5000);

				// Mark this as being done
				hasFirstKey = true;

				// Record new key
				apiManagerLogger.debug('Setting my_servers key. Key is "%s".', newApiKey);
				lastKnownApiKey = newApiKey;
				return;
			}

			// Record last known key
			apiManagerLogger.debug('Replacing my_servers key. Last known key was "%s". New key is "%s".', lastKnownApiKey, newApiKey);
			lastKnownApiKey = newApiKey;

			// Stop internal connection
			sockets.internal?.close();

			// Let's reconnect everything
			if (newApiKey) {
				// Wait for internal to close
				await sleep(1_000);

				// Start internal as we do on a clean start
				// This will take care of connecting to
				// relay and the subscriptions
				startInternal(newApiKey);
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
	// Log error to syslog
	log.error(error);

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
		process.exitCode = 1;
	});
});
