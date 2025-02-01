import 'reflect-metadata';
import 'global-agent/bootstrap.js';
import '@app/dotenv';

import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { unlinkSync } from 'fs';
import http from 'http';
import https from 'https';
import { WebSocket } from 'ws';

import type { RawServerDefault } from 'fastify';
import CacheableLookup from 'cacheable-lookup';
import { asyncExitHook, gracefulExit } from 'exit-hook';

import { logger } from '@app/core/log';
import { fileExistsSync } from '@app/core/utils/files/file-exists';
import { environment, PORT } from '@app/environment';
import * as envVars from '@app/environment';
import { setupNewMothershipSubscription } from '@app/mothership/subscribe-to-mothership';
import { store } from '@app/store';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file';
import { shutdownApiEvent } from '@app/store/actions/shutdown-api-event';
import { startMiddlewareListeners } from '@app/store/listeners/listener-middleware';
import { loadConfigFile } from '@app/store/modules/config';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { loadRegistrationKey } from '@app/store/modules/registration';
import { startStoreSync } from '@app/store/store-sync';
import { setupDynamixConfigWatch } from '@app/store/watch/dynamix-config-watch';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch';
import { StateManager } from '@app/store/watch/state-watch';
import { setupVarRunWatch } from '@app/store/watch/var-run-watch';

let server: NestFastifyApplication<RawServerDefault> | null = null;

const unlinkUnixPort = () => {
    if (isNaN(parseInt(PORT, 10))) {
        if (fileExistsSync(PORT)) unlinkSync(PORT);
    }
};

export const viteNodeApp = async () => {
    try {
        environment.IS_MAIN_PROCESS = true;

        logger.info('ENV %o', envVars);
        logger.info('PATHS %o', store.getState().paths);

        const cacheable = new CacheableLookup();

        Object.assign(global, { WebSocket });
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

        await setupNewMothershipSubscription();

        // Start listening to file updates
        StateManager.getInstance();

        // Start listening to key file changes
        setupRegistrationKeyWatch();

        // Start listening to docker events
        setupVarRunWatch();

        // Start listening to dynamix config file changes
        setupDynamixConfigWatch();

        // If port is unix socket, delete old socket before starting http server
        unlinkUnixPort();

        startMiddlewareListeners();

        // Start webserver
        const { bootstrapNestServer } = await import('@app/unraid-api/main');

        server = await bootstrapNestServer();

        asyncExitHook(
            async (signal) => {
                logger.info('Exiting with signal %s', signal);
                await server?.close?.();
                // If port is unix socket, delete socket before exiting
                unlinkUnixPort();

                shutdownApiEvent();

                gracefulExit();
            },
            { wait: 9999 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(error, 'API-ERROR');
        } else {
            logger.error(error, 'Encountered unexpected error');
        }
        if (server) {
            await server?.close?.();
        }
        shutdownApiEvent();
        // Kill application
        gracefulExit(1);
    }
};

await viteNodeApp();
