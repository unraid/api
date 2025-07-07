import { Inject, Injectable, Logger, OnModuleDestroy, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MinigraphStatus } from '../config/connect.config.js';
import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { EVENTS, GRAPHQL_PUBSUB_CHANNEL, GRAPHQL_PUBSUB_TOKEN } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipFallbackService } from './mothership-fallback.service.js';

@Injectable()
export class MothershipHandler implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipHandler.name);
    constructor(
        private readonly connectionService: MothershipConnectionService,
        @Inject(forwardRef(() => MothershipFallbackService))
        private readonly mothershipService: MothershipFallbackService,
        private readonly timeoutCheckerJob: TimeoutCheckerJob,
        @Inject(GRAPHQL_PUBSUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

    async onModuleDestroy() {
        await this.clear();
    }

    async clear() {
        this.timeoutCheckerJob.stop();
        this.connectionService.resetMetadata();
    }

    async setup() {
        await this.clear();
        const { state } = this.connectionService.getIdentityState();
        this.logger.verbose('cleared, got identity state');
        if (!state.apiKey) {
            this.logger.warn('No API key found; cannot setup mothership connection');
            return;
        }
        // The fallback service handles connection and subscription setup automatically
        await this.mothershipService.attemptConnection();
        this.logger.verbose(`Connected using ${this.mothershipService.getCurrentClientType()} client`);
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
