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
import { MothershipJobs } from './mothership/jobs/cloud-connection-check-jobs';
import { store } from '@app/store';
import { loadConfigFile, setConnectionStatus } from '@app/store/modules/config';
import { logger } from '@app/core/log';
import { startStoreSync } from '@app/store/store-sync';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { StateManager } from '@app/store/watch/state-watch';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch';
import { loadRegistrationKey } from '@app/store/modules/registration';
import { writeMemoryConfigSync } from './store/sync/config-disk-sync';
import { app, httpServer, server } from '@app/server';
import { config } from '@app/core/config';
import { unlinkSync } from 'fs';
import { fileExistsSync } from '@app/core/utils/files/file-exists';
import { setupDockerWatch } from '@app/store/watch/docker-watch';
import { setStatus } from '@app/store/modules/minigraph';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

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

	// Load initial registration key into store
	await store.dispatch(loadRegistrationKey());

	// Start listening to file updates
	StateManager.getInstance();

	// Start listening to key file changes
	setupRegistrationKeyWatch();

	// Start listening to docker events
	setupDockerWatch();

	// Try and load the HTTP server
	logger.debug('Starting HTTP server');

	// Disabled until we need the access token to work
	// TokenRefresh.init();

	// If port is unix socket, delete old socket before starting http server
	if (isNaN(parseInt(config.port, 10))) {
		if (fileExistsSync(config.port)) unlinkSync(config.port);
	}

	// Start apollo
	await server.start();
	server.applyMiddleware({ app });

	// Start webserver
	httpServer.listen(config.port);

	// On process exit stop HTTP server
	exitHook(() => {
		// If port is unix socket, delete socket before exiting
		if (isNaN(parseInt(config.port, 10))) {
			if (fileExistsSync(config.port)) unlinkSync(config.port);
		}
		store.dispatch(setStatus({ status: MinigraphStatus.DISCONNECTED, error: null }))
		writeMemoryConfigSync();
	});
}, async (error: NodeJS.ErrnoException) => {
	// Log error to syslog
	logger.error(error);

	// Write the new memory config with disconnected status
	store.dispatch(setStatus({ status: MinigraphStatus.DISCONNECTED, error: null }));
	writeMemoryConfigSync();

	// Stop server
	logger.debug('Stopping HTTP server');
	await server.stop();

	// Kill application
	process.exitCode = 1;
});
