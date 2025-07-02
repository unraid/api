import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MinigraphStatus } from '../config/connect.config.js';
import { EVENTS, GRAPHQL_PUBSUB_CHANNEL, GRAPHQL_PUBSUB_TOKEN } from '../helper/nest-tokens.js';
import { TimeoutCheckerJob } from '../job/timeout-checker.job.js';
import { MothershipConnectionService } from '../service/connection.service.js';
import { MothershipGraphqlClientService } from '../service/graphql.client.js';
import { MothershipSubscriptionHandler } from '../service/mothership-subscription.handler.js';

@Injectable()
export class MothershipHandler implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipHandler.name);
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly clientService: MothershipGraphqlClientService,
        private readonly subscriptionHandler: MothershipSubscriptionHandler,
        private readonly timeoutCheckerJob: TimeoutCheckerJob,
        @Inject(GRAPHQL_PUBSUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

    async onModuleDestroy() {
        await this.clear();
    }

    async clear() {
        this.timeoutCheckerJob.stop();
        this.subscriptionHandler.stopMothershipSubscription();
        await this.clientService.clearInstance();
        this.connectionService.resetMetadata();
        this.subscriptionHandler.clearAllSubscriptions();
    }

    async setup() {
        await this.clear();
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

    @OnEvent(EVENTS.IDENTITY_CHANGED, { async: true })
    async onIdentityChanged() {
        const { state } = this.connectionService.getIdentityState();
        if (state.apiKey) {
            this.logger.verbose('Identity changed; setting up mothership subscription');
            await this.setup();
        }
    }

    @OnEvent(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED, { async: true })
    async onMothershipConnectionStatusChanged() {
        const state = this.connectionService.getConnectionState();
        // Question: do we include MinigraphStatus.ERROR_RETRYING here?
        if (state && [MinigraphStatus.PING_FAILURE].includes(state.status)) {
            this.logger.verbose(
                'Mothership connection status changed to %s; setting up mothership subscription',
                state.status
            );
            await this.setup();
        }
    }

    /**
     * First listener triggered when the user logs out.
     *
     * It publishes the 'servers' and 'owner' endpoints to the pubsub event bus.
     *
     * @param reason - The reason for the logout.
     */
    @OnEvent(EVENTS.LOGOUT, { async: true, prependListener: true })
    async logout({ reason }: { reason?: string }) {
        this.logger.log('Logging out user: %s', reason ?? 'No reason provided');
        // publish to the 'servers' and 'owner' endpoints
        await this.legacyPubSub.publish(GRAPHQL_PUBSUB_CHANNEL.SERVERS, { servers: [] });
        await this.legacyPubSub.publish(GRAPHQL_PUBSUB_CHANNEL.OWNER, {
            owner: { username: 'root', url: '', avatar: '' },
        });
        this.timeoutCheckerJob.stop();
        await this.clear();
    }
}
