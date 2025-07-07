import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';

import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';

/**
 * Controller for (starting and stopping) the mothership stack:
 * - GraphQL client (to mothership)
 * - Subscription handler (websocket communication with mothership)
 * - Timeout checker (to detect if the connection to mothership is lost)
 * - Connection service (controller for connection state & metadata)
 */
@Injectable()
export class MothershipController implements OnModuleDestroy, OnApplicationBootstrap {
    private readonly logger = new Logger(MothershipController.name);
    constructor(
        private readonly clientService: MothershipGraphqlClientService,
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

    async stop() {
        this.timeoutCheckerJob.stop();
        this.subscriptionHandler.stopMothershipSubscription();
        await this.clientService.clearInstance();
        this.connectionService.resetMetadata();
        this.subscriptionHandler.clearAllSubscriptions();
    }

    async initOrRestart() {
        await this.stop();
        const { state } = this.connectionService.getIdentityState();
        this.logger.verbose('cleared, got identity state');
        if (!state.apiKey) {
            this.logger.warn('No API key found; cannot setup mothership subscription');
            return;
        }
        await this.clientService.createClientInstance();
        await this.subscriptionHandler.subscribeToMothershipEvents();
        this.timeoutCheckerJob.start();
    }
}
