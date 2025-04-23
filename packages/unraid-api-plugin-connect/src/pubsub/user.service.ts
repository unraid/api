import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import type { PubSub } from 'graphql-subscriptions';

import { MothershipConnectionService } from '../mothership/connection.service.js';
import { GraphqlClientService } from '../mothership/graphql.client.js';
import { EVENTS, GRAPHQL_PUB_SUB_TOKEN, PUBSUB_CHANNEL } from './consts.js';
import { MinigraphStatus } from '../config.entity.js';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly connectionService: MothershipConnectionService,
        private readonly clientService: GraphqlClientService,
        private readonly eventEmitter: EventEmitter2,
        @Inject(GRAPHQL_PUB_SUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

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
        await this.resetMothershipConnection();
    }

    private async resetMothershipConnection() {
        await this.clientService.clearInstance();
        this.configService.set('connect.mothership.status', MinigraphStatus.PRE_INIT);
        this.configService.set('connect.mothership.error', null);
        this.configService.set('connect.mothership.lastPing', null);
        this.configService.set('connect.mothership.selfDisconnectedSince', null);
        this.configService.set('connect.mothership.timeout', null);
        this.configService.set('connect.mothership.timeoutStart', null);
    }
}
