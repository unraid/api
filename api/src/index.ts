import 'reflect-metadata';
import 'global-agent/bootstrap';

import http from 'http';
import https from 'https';
import CacheableLookup from 'cacheable-lookup';
import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { logger } from '@app/core/log';
import { startStoreSync } from '@app/store/store-sync';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { StateManager } from '@app/store/watch/state-watch';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch';
import { loadRegistrationKey } from '@app/store/modules/registration';
import { unlinkSync } from 'fs';
import { fileExistsSync } from '@app/core/utils/files/file-exists';
import { PORT, environment } from '@app/environment';
import { shutdownApiEvent } from '@app/store/actions/shutdown-api-event';
import { PingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs';
import { setupDynamixConfigWatch } from '@app/store/watch/dynamix-config-watch';
import { setupVarRunWatch } from '@app/store/watch/var-run-watch';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file';
import { startMiddlewareListeners } from '@app/store/listeners/listener-middleware';
import { validateApiKeyIfPresent } from '@app/store/listeners/api-key-listener';
import { bootstrapNestServer } from '@app/unraid-api/main';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type RawServerDefault } from 'fastify';
import { setupLogRotation } from '@app/core/logrotate/setup-logrotate';
import { WebSocket } from 'ws';
import exitHook from 'async-exit-hook';
import * as env from '@app/environment';

let server: NestFastifyApplication<RawServerDefault> | null = null;

const unlinkUnixPort = () => {
    if (isNaN(parseInt(PORT, 10))) {
        if (fileExistsSync(PORT)) unlinkSync(PORT);
    }
};

try {
    environment.IS_MAIN_PROCESS = true;

    logger.debug('ENV %o', env);

    const cacheable = new CacheableLookup();

    Object.assign(global, { WebSocket });
    // Ensure all DNS lookups are cached for their TTL
    cacheable.install(http.globalAgent);
    cacheable.install(https.globalAgent);

    // Start file <-> store sync
    // Must occur before config is loaded to ensure that the handler can fix broken configs
    await startStoreSync();

    await setupLogRotation();

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
    setupVarRunWatch();

    // Start listening to dynamix config file changes
    setupDynamixConfigWatch();

    // Disabled until we need the access token to work
    // TokenRefresh.init();

    // If port is unix socket, delete old socket before starting http server
    unlinkUnixPort();

    // Start webserver
    server = await bootstrapNestServer();
    PingTimeoutJobs.init();

    startMiddlewareListeners();

    await validateApiKeyIfPresent();

    // On process exit stop HTTP server - this says it supports async but it doesnt seem to
    exitHook(() => {
        console.log('exithook');
        server?.close?.();
        // If port is unix socket, delete socket before exiting
        unlinkUnixPort();

        shutdownApiEvent();

        process.exit(0);
    });
    // Start a loop to run the app
    await new Promise(() => {});
} catch (error: unknown) {
    if (error instanceof Error) {
        logger.error('API-ERROR %s %s', error.message, error.stack);
    }
    if (server) {
        await server?.close?.();
    }
    shutdownApiEvent();
    // Kill application
    process.exit(1);
}
