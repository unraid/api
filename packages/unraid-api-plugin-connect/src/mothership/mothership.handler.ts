import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MinigraphStatus } from '../config.entity.js';
import { EVENTS, GRAPHQL_PUB_SUB_TOKEN, PUBSUB_CHANNEL } from '../pubsub/consts.js';
import { MothershipConnectionService } from './connection.service.js';
import { GraphqlClientService } from './graphql.client.js';

@Injectable()
export class MothershipHandler implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipHandler.name);
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly clientService: GraphqlClientService,
        @Inject(GRAPHQL_PUB_SUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

    async onModuleDestroy() {
        await this.clear();
    }

    async clear() {
        await this.clientService.clearInstance();
        this.connectionService.resetMetadata();
    }

    async setup() {
        await this.clear();
        const { state } = this.connectionService.getIdentityState();
        if (!state.apiKey) {
            this.logger.warn('No API key found; cannot setup mothership subscription');
            return;
        }
        await this.clientService.createClientInstance();
        // todo: subscribe to api key events
        // todo: init ping timeout jobs
    }

    @OnEvent(EVENTS.IDENTITY_CHANGED)
    async onIdentityChanged() {
        const { state } = this.connectionService.getIdentityState();
        if (state.apiKey) {
            await this.setup();
        }
    }

    @OnEvent(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED)
    async onMothershipConnectionStatusChanged() {
        const state = this.connectionService.getConnectionState();
        if (state && [MinigraphStatus.PING_FAILURE, MinigraphStatus.PRE_INIT].includes(state.status)) {
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
        this.logger.error('Logging out user: %s', reason ?? 'No reason provided');
        // publish to the 'servers' and 'owner' endpoints
        await this.legacyPubSub.publish(PUBSUB_CHANNEL.SERVERS, { servers: [] });
        await this.legacyPubSub.publish(PUBSUB_CHANNEL.OWNER, {
            owner: { username: 'root', url: '', avatar: '' },
        });
        // todo: stop ping timeout jobs
        await this.clear();
    }
}
