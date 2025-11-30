import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';

import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { MothershipConnectionService } from './connection.service.js';
import { UnraidServerClientService } from './unraid-server-client.service.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';

/**
 * Controller for (starting and stopping) the mothership stack:
 * - UnraidServerClient (websocket communication with mothership)
 * - Subscription handler (websocket communication with mothership)
 * - Timeout checker (to detect if the connection to mothership is lost)
 * - Connection service (controller for connection state & metadata)
 */
@Injectable()
export class MothershipController implements OnModuleDestroy, OnApplicationBootstrap {
    private readonly logger = new Logger(MothershipController.name);
    constructor(
        private readonly clientService: UnraidServerClientService,
        private readonly connectionService: MothershipConnectionService,
        private readonly subscriptionHandler: MothershipSubscriptionHandler,
        private readonly timeoutCheckerJob: TimeoutCheckerJob
    ) {}

    async onModuleDestroy() {
        await this.stop();
    }

    async onApplicationBootstrap() {
        await this.initOrRestart();
    }

    /**
     * Stops the mothership stack. Throws on first error.
     */
    async stop() {
        this.timeoutCheckerJob.stop();
        this.subscriptionHandler.stopMothershipSubscription();
        if (this.clientService.getClient()) {
            this.clientService.getClient()?.disconnect();
        }
        this.connectionService.resetMetadata();
        this.subscriptionHandler.clearAllSubscriptions();
    }

    /**
     * Attempts to stop, then starts the mothership stack. Throws on first error.
     */
    async initOrRestart() {
        await this.stop();
        const identityState = this.connectionService.getIdentityState();
        this.logger.verbose('cleared, got identity state');
        if (!identityState.isLoaded || !identityState.state.apiKey) {
            this.logger.warn('No API key found; cannot setup mothership connection');
            return;
        }
        await this.clientService.reconnect();
        await this.subscriptionHandler.subscribeToMothershipEvents();
        this.timeoutCheckerJob.start();
    }
}
