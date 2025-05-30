import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';

import { GRAPHQL_PUBSUB_CHANNEL, GRAPHQL_PUBSUB_TOKEN } from '../pubsub/consts.js';
import { EVENTS } from '../pubsub/consts.js';

@Injectable()
export class ConnectLoginHandler {
    private readonly logger = new Logger(ConnectLoginHandler.name);

    constructor(
        @Inject(GRAPHQL_PUBSUB_TOKEN)
        private readonly legacyPubSub: PubSub
    ) {}

    @OnEvent(EVENTS.LOGIN)
    async onLogin(userInfo: {
        username: string;
        avatar: string;
        email: string;
        apikey: string;
        localApiKey: string;
    }) {
        this.logger.log('Logging in user: %s', userInfo.username);
        
        // Publish to the owner channel
        await this.legacyPubSub.publish(GRAPHQL_PUBSUB_CHANNEL.OWNER, {
            owner: {
                username: userInfo.username,
                avatar: userInfo.avatar,
                url: '',
            },
        });
    }
} 