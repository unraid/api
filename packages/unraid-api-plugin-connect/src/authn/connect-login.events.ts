import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MyServersConfig } from '../config/connect.config.js';
import { EVENTS, GRAPHQL_PUBSUB_CHANNEL, GRAPHQL_PUBSUB_TOKEN } from '../helper/nest-tokens.js';

@Injectable()
export class ConnectLoginHandler {
    constructor(
        @Inject(GRAPHQL_PUBSUB_TOKEN) private readonly pubsub: PubSub,
        private readonly config: ConfigService
    ) {}

    @OnEvent(EVENTS.IDENTITY_CHANGED, { async: true })
    async onIdentityChanged() {
        const user = this.config.getOrThrow<MyServersConfig>('connect.config');
        await this.pubsub.publish(GRAPHQL_PUBSUB_CHANNEL.OWNER, {
            owner: { username: user.username, avatar: user.avatar, url: '' },
        });
    }
}
