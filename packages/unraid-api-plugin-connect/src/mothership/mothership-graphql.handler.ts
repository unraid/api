import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';

import { MinigraphStatus } from '../config.entity.js';
import { EVENTS, GRAPHQL_PUBSUB_TOKEN, GRAPHQL_PUBSUB_CHANNEL } from '../pubsub/consts.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { ApolloDriver } from '@nestjs/apollo';

@Injectable()
export class MothershipGraphqlHandler {
    private readonly logger = new Logger(MothershipGraphqlHandler.name);
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly clientService: MothershipGraphqlClientService,
        @Inject(GRAPHQL_PUBSUB_TOKEN)
        private readonly legacyPubSub: PubSub,
        private driver: ApolloDriver,
    ) {}
    
}
