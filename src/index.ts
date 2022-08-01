/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { am } from 'am';
import http from 'http';
import https from 'https';
import CacheableLookup from 'cacheable-lookup';
import { Serializer as IniSerializer } from 'multi-ini';
import exitHook from 'async-exit-hook';
import getServerAddress from 'get-server-address';
import { core, logger, apiManager, paths, pubsub } from '@app/core';
import { server } from '@app/server';
import { loadState } from '@app/core/utils/misc/load-state';
import { writeFileSync } from 'fs';
import { MyServersConfig } from '@app/types/my-servers-config';
import { userCache } from '@app/cache/user';
import { cloudConnector } from './mothership/cloud-connector';

// Ini serializer

const serializer = new IniSerializer({
	// This ensures it ADDs quotes

	keep_quotes: false,
}) as {
	serialize: (content: unknown) => string;
};

// Boot app
void am(async () => {
	const cacheable = new CacheableLookup();

	// Ensure all DNS lookups are cached for their TTL
	cacheable.install(http.globalAgent);
	cacheable.install(https.globalAgent);

	// Load core
	await core.load();

	// Try and load the HTTP server
	logger.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		logger.info('Server is up! %s', getServerAddress(server.server));
	});

	// It has it's first keys loaded
	apiManager.on('ready', async () => {
		try {
			// Try to start server
			await server.start().catch(error => {
				logger.error(error);

				// On process exit
				exitHook(async () => {
					logger.debug('Stopping HTTP server');

					// Stop the server
					server.stop();
				});
			});

			await cloudConnector.checkCloudConnections();
			// Check cloud connections
		} catch (error: unknown) {
			logger.error('Failed creating sockets on "ready" event with error %s.', (error as Error).message);
		}
	});

	// If key is removed then disconnect our sockets
	apiManager.on('expire', async name => {
		try {
			// Bail if this isn't our key
			if (name !== 'my_servers') {
				return;
			}

			logger.debug('API key in cfg is invalid, attempting to sign user out via cfg.');
			const configPath = paths['myservers-config'];
			const myserversConfigFile = loadState<Partial<MyServersConfig>>(configPath);

			const { apikey: _, email: __, username: ___, avatar: ____, wanaccess: _____, ...remote } = myserversConfigFile?.remote ?? {};

			// Rebuild cfg with wiped remote section
			// All the _ consts above have been removed
			const data = {
				...myserversConfigFile,
				remote,
			};

			// Stringify data
			const stringifiedData = serializer.serialize(data);

			// Update config file
			writeFileSync(configPath, stringifiedData);

			// Check cloud connections
			await cloudConnector.checkCloudConnections();

			// Clear servers cache
			userCache.del('mine');

			// Publish to servers endpoint
			await pubsub.publish('servers', {
				servers: [],
			});

			// Publish to owner endpoint
			await pubsub.publish('owner', {
				owner: {
					username: 'root',
					url: '',
					avatar: '',
				},
			});
		} catch (error: unknown) {
			logger.error('Failed updating sockets on "expire" event with error %s.', error);
		}
	});

	apiManager.on('replace', async () => {
		try {
			// Check cloud connections
			await cloudConnector.checkCloudConnections();
		} catch (error: unknown) {
			logger.error('Failed updating sockets on apiKey "replace" event with error %s.', error);
		}
	});

	// Load nchan
	core.loadNchan().catch(error => {
		logger.error(error);
	});
}, async (error: NodeJS.ErrnoException) => {
	// Log error to syslog
	logger.error(error);

	// Stop server
	server.stop(async () => {
		// Kill application
		process.exitCode = 1;
	});
});
