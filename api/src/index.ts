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
import { getServerIdentifier } from '@app/core/utils/server-identifier.js';
import { environment, PATHS_CONFIG_MODULES, PORT } from '@app/environment.js';
import * as envVars from '@app/environment.js';
import { shutdownApiEvent } from '@app/store/actions/shutdown-api-event.js';
import { loadDynamixConfig, store } from '@app/store/index.js';
import { startMiddlewareListeners } from '@app/store/listeners/listener-middleware.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { setupRegistrationKeyWatch } from '@app/store/watch/registration-watch.js';
import { StateManager } from '@app/store/watch/state-watch.js';

let server: NestFastifyApplication<RawServerDefault> | null = null;

// PM2 listen_timeout is 15 seconds (ecosystem.config.json)
// We use 13 seconds as our total budget to ensure our timeout triggers before PM2 kills us
const TOTAL_STARTUP_BUDGET_MS = 13_000;
// Reserve time for the NestJS bootstrap (the most critical and time-consuming operation)
const BOOTSTRAP_RESERVED_MS = 8_000;
// Maximum time for any single pre-bootstrap operation
const MAX_OPERATION_TIMEOUT_MS = 2_000;

/**
 * Tracks remaining startup time budget to ensure we don't exceed PM2's timeout.
 */
class StartupBudget {
    private startTime: number;
    private budgetMs: number;

    constructor(budgetMs: number) {
        this.startTime = Date.now();
        this.budgetMs = budgetMs;
    }

    /** Returns remaining time in milliseconds */
    remaining(): number {
        return Math.max(0, this.budgetMs - (Date.now() - this.startTime));
    }

    /** Returns elapsed time in milliseconds */
    elapsed(): number {
        return Date.now() - this.startTime;
    }

    /** Returns timeout for an operation, capped by remaining budget */
    getTimeout(maxMs: number, reserveMs: number = 0): number {
        const available = this.remaining() - reserveMs;
        return Math.max(100, Math.min(maxMs, available)); // At least 100ms
    }

    /** Checks if we have enough time remaining */
    hasTimeFor(requiredMs: number): boolean {
        return this.remaining() >= requiredMs;
    }
}

/**
 * Wraps a promise with a timeout to prevent hangs during startup.
 * If the operation takes longer than timeoutMs, it rejects with a timeout error.
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
};

const unlinkUnixPort = () => {
    if (isNaN(parseInt(PORT, 10))) {
        if (fileExistsSync(PORT)) unlinkSync(PORT);
    }
};

export const viteNodeApp = async () => {
    const budget = new StartupBudget(TOTAL_STARTUP_BUDGET_MS);

    try {
        await import('json-bigint-patch');
        environment.IS_MAIN_PROCESS = true;

        /**------------------------------------------------------------------------
         *              Attaching getServerIdentifier to globalThis

         *  getServerIdentifier is tightly coupled to the deprecated redux store,
         *  which we don't want to share with other packages or plugins.
         *
         *  At the same time, we need to use it in @unraid/shared as a building block,
         *  where it's used & available outside of NestJS's DI context.
         *
         *  Attaching to globalThis is a temporary solution to avoid refactoring
         *  config sync & management outside of NestJS's DI context.
         *
         *  Plugin authors should import getServerIdentifier from @unraid/shared instead,
         *  to avoid breaking changes to their code.
         *------------------------------------------------------------------------**/
        globalThis.getServerIdentifier = getServerIdentifier;
        logger.info('ENV %o', envVars);
        logger.info('PATHS %o', store.getState().paths);

        // Note: we use logger.info for checkpoints instead of a lower log level
        // to ensure emission during an unraid server's boot,
        // where the log level will be set to INFO by default.

        // Create config directory
        try {
            await mkdir(PATHS_CONFIG_MODULES, { recursive: true });
            logger.info('Config directory ready');
        } catch (error) {
            logger.error(error, 'Failed to create config directory');
            throw error;
        }

        const cacheable = new CacheableLookup();

        Object.assign(global, { WebSocket });
        // Ensure all DNS lookups are cached for their TTL
        cacheable.install(http.globalAgent);
        cacheable.install(https.globalAgent);

        // Load emhttp state into store
        try {
            const timeout = budget.getTimeout(MAX_OPERATION_TIMEOUT_MS, BOOTSTRAP_RESERVED_MS);
            await withTimeout(store.dispatch(loadStateFiles()), timeout, 'loadStateFiles');
            logger.info('Emhttp state loaded');
        } catch (error) {
            logger.error(error, 'Failed to load emhttp state files');
            logger.warn('Continuing with default state');
        }

        // Load initial registration key into store
        try {
            const timeout = budget.getTimeout(MAX_OPERATION_TIMEOUT_MS, BOOTSTRAP_RESERVED_MS);
            await withTimeout(store.dispatch(loadRegistrationKey()), timeout, 'loadRegistrationKey');
            logger.info('Registration key loaded');
        } catch (error) {
            logger.error(error, 'Failed to load registration key');
            logger.warn('Continuing without registration key');
        }

        // Load my dynamix config file into store
        try {
            loadDynamixConfig();
            logger.info('Dynamix config loaded');
        } catch (error) {
            logger.error(error, 'Failed to load dynamix config');
            logger.warn('Continuing with default dynamix config');
        }

        // Start listening to file updates
        try {
            StateManager.getInstance();
            logger.info('State manager initialized');
        } catch (error) {
            logger.error(error, 'Failed to initialize state manager');
            logger.warn('Continuing without state watching');
        }

        // Start listening to key file changes
        try {
            setupRegistrationKeyWatch();
            logger.info('Registration key watch active');
        } catch (error) {
            logger.error(error, 'Failed to setup registration key watch');
            logger.warn('Continuing without key file watching');
        }

        // If port is unix socket, delete old socket before starting http server
        unlinkUnixPort();

        startMiddlewareListeners();

        // Start webserver - use all remaining budget
        try {
            const bootstrapTimeout = budget.remaining();
            if (bootstrapTimeout < 1000) {
                logger.warn(
                    `Insufficient startup budget remaining (${bootstrapTimeout}ms) for NestJS bootstrap`
                );
            }
            logger.info('Bootstrapping NestJS server (budget: %dms)...', bootstrapTimeout);
            const { bootstrapNestServer } = await import('@app/unraid-api/main.js');
            server = await withTimeout(bootstrapNestServer(), bootstrapTimeout, 'bootstrapNestServer');
            logger.info('Startup complete in %dms', budget.elapsed());
        } catch (error) {
            logger.error(error, 'Failed to start NestJS server');
            throw error; // This is critical - must rethrow to trigger graceful exit
        }

        asyncExitHook(
            async (signal) => {
                logger.info('Exiting with signal %d', signal);
                await server?.close?.();
                // If port is unix socket, delete socket before exiting
                unlinkUnixPort();

                shutdownApiEvent();

                gracefulExit();
            },
            { wait: 10_000 }
        );

        return server;
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
