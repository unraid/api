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
import { getters, store } from '@app/store';
import { loadConfigFile, setConnectionStatus } from '@app/store/modules/config';
import { core } from '@app/core/core';
import { logger } from '@app/core/log';
import { startStoreSync } from '@app/store/store-sync';
import { updateNginxState } from '@app/store/modules/nginx';
import { loadState } from '@app/core/utils/misc/load-state';
import { NginxIni } from '@app/store/modules/state-parsers/nginx';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { setupNchanWatch } from '@app/store/watch/nchan-watch';
import { writeMemoryConfigSync } from './store/sync/config-disk-sync';

// Boot app
void am(async () => {
	const cacheable = new CacheableLookup();

	// Ensure all DNS lookups are cached for their TTL
	cacheable.install(http.globalAgent);
	cacheable.install(https.globalAgent);

	// Load core
	await core.load();

	// Start file <-> store sync
	// Must occur before config is loaded to ensure that the handler can fix broken configs
	await startStoreSync();

	// Init mothership jobs - they are started by decorators on the class
	MothershipJobs.init();

	// Load my servers config file into store
	await store.dispatch(loadConfigFile());

	// Load emhttp state into store
	await store.dispatch(loadStateFiles());

	// Load nginx.ini into store
	const state = loadState<Partial<NginxIni>>(getters.paths()['nginx-state']);
	store.dispatch(updateNginxState({
		ipv4: {
			lan: state?.nginxLanfqdn ?? null,
			wan: state?.nginxWanfqdn ?? null,
		},
		ipv6: {
			lan: state?.nginxLanfqdn6 ?? null,
			wan: state?.nginxWanfqdn6 ?? null,
		},
	}));

	// Start listening to nchan updates
	await setupNchanWatch();

	// Try and load the HTTP server
	logger.debug('Starting HTTP server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		logger.info('Server is up! %s', getServerAddress(server.server));
	});

	// Try to start HTTP server
	await server.start();

	// On process exit stop HTTP server
	exitHook(() => {
		// Stop the HTTP server
		server.stop();
		store.dispatch(setConnectionStatus({ minigraph: 'disconnected', relay: 'disconnected' }));
		writeMemoryConfigSync();
	});
}, async (error: NodeJS.ErrnoException) => {
	// Log error to syslog
	logger.error(error);

	// Write the new memory config with disconnected status
	store.dispatch(setConnectionStatus({ minigraph: 'disconnected', relay: 'disconnected' }));
	writeMemoryConfigSync();
	// Stop server
	logger.debug('Stopping HTTP server');

	server.stop(async () => {
		// Kill application
		process.exitCode = 1;
	});
});
