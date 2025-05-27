import 'reflect-metadata';
import 'global-agent/bootstrap.js';
import '@app/dotenv.js';

import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { unlinkSync } from 'fs';
import { mkdir } from 'fs/promises';
import http from 'http';
import https from 'https';

import type { RawServerDefault } from 'fastify';
import CacheableLookup from 'cacheable-lookup';
import { asyncExitHook, gracefulExit } from 'exit-hook';
import { WebSocket } from 'ws';

import { logger } from '@app/core/log.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { environment, PATHS_CONFIG_MODULES, PORT } from '@app/environment.js';
import * as envVars from '@app/environment.js';
import { setupNewMothershipSubscription } from '@app/mothership/subscribe-to-mothership.js';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { shutdownApiEvent } from '@app/store/actions/shutdown-api-event.js';
import { store } from '@app/store/index.js';
import { startMiddlewareListeners } from '@app/store/listeners/listener-middleware.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { startStoreSync } from '@app/store/store-sync.js';
import { setupDynamixConfigWatch } from '@app/store/watch/dynamix-config-watch.js';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch.js';
import { StateManager } from '@app/store/watch/state-watch.js';

let server: NestFastifyApplication<RawServerDefault> | null = null;

const unlinkUnixPort = () => {
    if (isNaN(parseInt(PORT, 10))) {
        if (fileExistsSync(PORT)) unlinkSync(PORT);
    }
};

export const viteNodeApp = async () => {
    try {
        await import('json-bigint-patch');
        environment.IS_MAIN_PROCESS = true;

        logger.info('ENV %o', envVars);
        logger.info('PATHS %o', store.getState().paths);

        await mkdir(PATHS_CONFIG_MODULES, { recursive: true });

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

        // Start listening to dynamix config file changes
        setupDynamixConfigWatch();

        // If port is unix socket, delete old socket before starting http server
        unlinkUnixPort();

        startMiddlewareListeners();

        // Start webserver
        const { bootstrapNestServer } = await import('@app/unraid-api/main.js');

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
