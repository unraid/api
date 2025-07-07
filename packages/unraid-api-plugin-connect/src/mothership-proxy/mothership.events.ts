import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MinigraphStatus } from '../config/connect.config.js';
import { EVENTS, GRAPHQL_PUBSUB_CHANNEL, GRAPHQL_PUBSUB_TOKEN } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipController } from './mothership.controller.js';

@Injectable()
export class MothershipHandler {
    private readonly logger = new Logger(MothershipHandler.name);
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly mothershipController: MothershipController,
        @Inject(GRAPHQL_PUBSUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

    @OnEvent(EVENTS.IDENTITY_CHANGED, { async: true })
    async onIdentityChanged() {
        const { state } = this.connectionService.getIdentityState();
        if (state.apiKey) {
            this.logger.verbose('Identity changed; setting up mothership subscription');
            await this.mothershipController.initOrRestart();
        }
    }

    @OnEvent(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED, { async: true })
    async onMothershipConnectionStatusChanged() {
        const state = this.connectionService.getConnectionState();
        if (
            state &&
            [MinigraphStatus.PING_FAILURE, MinigraphStatus.ERROR_RETRYING].includes(state.status)
        ) {
            this.logger.verbose(
                'Mothership connection status changed to %s; setting up mothership subscription',
                state.status
            );
            await this.mothershipController.initOrRestart();
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
        await this.mothershipController.stop();
    }
}
