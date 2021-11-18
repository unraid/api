/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import am from 'am';
import { Serializer as IniSerializer } from 'multi-ini';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { core, log, apiManager, paths } from './core';
import { server } from './server';
import { checkConnection } from './mothership';
import { loadState } from './core/utils/misc/load-state';
import { writeFileSync } from 'fs';

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false
});

// Boot app
am(async () => {
	// Load core
	await core.load();

	// Try and load the HTTP server
	log.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		log.info('Server is up! %s', getServerAddress(server.server));
	});

	// It has it's first keys loaded
	apiManager.on('ready', async () => {
		try {
			// Try to start server
			await server.start().catch(error => {
				log.error(error);

				// On process exit
				exitHook(async () => {
					log.debug('Stopping HTTP server');

					// Stop the server
					server.stop();
				});
			});

			// Check relay connection
			await checkConnection();
		} catch (error: unknown) {
			log.error('Failed creating sockets on "ready" event with error %s.', (error as Error).message);
		}
	});

	// If key is removed then disconnect our sockets
	apiManager.on('expire', async name => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			log.debug('API key in cfg is invalid, attempting to sign user our via cfg.');
			const configPath = paths.get('myservers-config')!;
			const myserversConfigFile = loadState<Partial<{
				remote: {
					wanaccess?: string;
					wanport?: string;
					apikey?: string;
					email?: string;
					username?: string;
					avatar?: string;
				};
			}>>(configPath);
			const { apikey: _, email: __, username: ___, avatar: ____, ...remote } = myserversConfigFile.remote ?? {};

			// Rebuild cfg with wiped remote section
			// All the _ consts above have been removed
			const data = {
				...myserversConfigFile,
				remote
			};

			// Stringify data
			const stringifiedData = serializer.serialize(data);

			// Update config file
			writeFileSync(configPath, stringifiedData);

			// Check relay connection
			await checkConnection();
		} catch (error: unknown) {
			log.error('Failed updating sockets on "expire" event with error %s.', error);
		}
	});

	apiManager.on('replace', async () => {
		try {
			// Check relay connection
			await checkConnection();
		} catch (error: unknown) {
			log.error('Failed updating sockets on apiKey "replace" event with error %s.', error);
		}
	});

	// Every 5s check if our connection to relay is okay
	setInterval(async () => {
		try {
			// Check relay connection
			await checkConnection();
		} catch (error: unknown) {
			log.error('Failed checking connection with error %s.', error);
		}
	}, 5_000);

	// Load nchan
	core.loadNchan().catch(error => {
		log.error(error);
	});
}, async (error: NodeJS.ErrnoException) => {
	// Log error to syslog
	log.error(error);

	// Stop server
	server.stop(async () => {
		// Kill application
		process.exitCode = 1;
	});
});
