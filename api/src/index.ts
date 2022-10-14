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
import { MothershipJobs } from './mothership/jobs/cloud-connection-check-jobs';
import { getServerAddress } from '@app/common/get-server-address';
import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { logger } from '@app/core/log';
import { startStoreSync } from '@app/store/store-sync';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { setupNchanWatch } from '@app/store/watch/nchan-watch';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch';

// Boot app
void am(async () => {
	const cacheable = new CacheableLookup();

	// Ensure all DNS lookups are cached for their TTL
	cacheable.install(http.globalAgent);
	cacheable.install(https.globalAgent);

	// Start file <-> store sync
	// Must occur before config is loaded to ensure that the handler can fix broken configs
	await startStoreSync();

	// Init mothership jobs - they are started by decorators on the class
	MothershipJobs.init();

	// Load my servers config file into store
	await store.dispatch(loadConfigFile());

	// Load emhttp state into store
	await store.dispatch(loadStateFiles());

	// Start listening to nchan updates
	await setupNchanWatch();

	// Start listening to key file changes
	setupRegistrationKeyWatch();

	// Try and load the HTTP server
	logger.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		logger.info('Server is up! %s', getServerAddress(server.server));
	});

	// Try to start HTTP server
	await server.start();

	// On process exit stop HTTP server
	exitHook(async () => {
		// Stop the HTTP server
		server.stop();
	});
}, async (error: NodeJS.ErrnoException) => {
	// Log error to syslog
	logger.error(error);

	// Stop server
	logger.debug('Stopping HTTP server');
	server.stop(async () => {
		// Kill application
		process.exitCode = 1;
	});
});
