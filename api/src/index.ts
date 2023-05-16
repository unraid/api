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
import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { logger } from '@app/core/log';
import { startStoreSync } from '@app/store/store-sync';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { StateManager } from '@app/store/watch/state-watch';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch';
import { loadRegistrationKey } from '@app/store/modules/registration';
import { createApolloExpressServer } from '@app/server';
import { unlinkSync } from 'fs';
import { fileExistsSync } from '@app/core/utils/files/file-exists';
import { PORT, environment } from '@app/environment';
import { shutdownApiEvent } from '@app/store/actions/shutdown-api-event';
import { PingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs';
import { type BaseContext, type ApolloServer } from '@apollo/server';
import { setupDynamixConfigWatch } from '@app/store/watch/dynamix-config-watch';
import { setupVarRunWatch } from '@app/store/watch/var-run-watch';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file';

let server: ApolloServer<BaseContext>;

const unlinkUnixPort = () => {
    if (isNaN(parseInt(PORT, 10))) {
        if (fileExistsSync(PORT)) unlinkSync(PORT);
    }
};
// Boot app
void am(
    async () => {
        environment.IS_MAIN_PROCESS = true;
        const cacheable = new CacheableLookup();

        Object.assign(global, { WebSocket: require('ws') });
        // Ensure all DNS lookups are cached for their TTL
        cacheable.install(http.globalAgent);
        cacheable.install(https.globalAgent);

        // Start file <-> store sync
        // Must occur before config is loaded to ensure that the handler can fix broken configs
        await startStoreSync();

        // Load my servers config file into store
        await store.dispatch(loadConfigFile());

        // Load emhttp state into store
        await store.dispatch(loadStateFiles());

        // Load initial registration key into store
        await store.dispatch(loadRegistrationKey());

        // Load my dynamix config file into store
        await store.dispatch(loadDynamixConfigFile());

        // Start listening to file updates
        StateManager.getInstance();

        // Start listening to key file changes
        setupRegistrationKeyWatch();

        // Start listening to docker events
        await setupVarRunWatch();

        // Start listening to dynamix config file changes
        setupDynamixConfigWatch();

        // Try and load the HTTP server
        logger.debug('Starting HTTP server');

        // Disabled until we need the access token to work
        // TokenRefresh.init();

        // If port is unix socket, delete old socket before starting http server
        unlinkUnixPort();

        // Start webserver
        server = await createApolloExpressServer();

        PingTimeoutJobs.init();

        // On process exit stop HTTP server - this says it supports async but it doesnt seem to
        exitHook(() => {
            // If port is unix socket, delete socket before exiting
            unlinkUnixPort();

            shutdownApiEvent();
            process.exitCode = 0;
        });
    },
    async (error: NodeJS.ErrnoException) => {
        // Log error to syslog
        logger.error('API-GLOBAL-ERROR', error);
        shutdownApiEvent();

        // Stop server
        logger.debug('Stopping HTTP server');
        if (server) {
            await server.stop();
        }

        // Kill application
        process.exitCode = 1;
    }
);
