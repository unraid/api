/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */
import 'reflect-metadata';
import { am } from 'am';
import http from 'http';
import https from 'https';
import CacheableLookup from 'cacheable-lookup';
import exitHook from 'async-exit-hook';
import { server } from '@app/server';
import { userCache } from '@app/cache/user';
import { MothershipJobs } from './mothership/jobs/cloud-connection-check-jobs';
import { getServerAddress } from '@app/common/get-server-address';
import { store } from '@app/store';
import { loadConfigFile, updateUserConfig } from '@app/store/modules/config';
import { core } from '@app/core/core';
import { logger } from '@app/core/log';
import { apiManager } from '@app/core/api-manager';
import { pubsub } from '@app/core/pubsub';
import { startStoreSync } from '@app/store/store-sync';

// Boot app
void am(async () => {
	const cacheable = new CacheableLookup();

	// Ensure all DNS lookups are cached for their TTL
	cacheable.install(http.globalAgent);
	cacheable.install(https.globalAgent);

	// Load core
	await core.load();

	// Init mothership jobs - they are started by decorators on the class
	MothershipJobs.init();

	// Load my servers config file into store
	await store.dispatch(loadConfigFile());

	// Start file <-> store sync
	await startStoreSync();

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

			// Rebuild cfg with wiped remote section
			store.dispatch(updateUserConfig({
				remote: {
					apikey: undefined,
					email: undefined,
					username: undefined,
					avatar: undefined,
					wanaccess: undefined,
				},
			}));

			// Check cloud connections
			// await cloudConnector.checkCloudConnections();

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
			// await cloudConnector.checkCloudConnections();
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
