import { Module } from '@nestjs/common';

import { PubSub } from 'graphql-subscriptions';

import { UPSResolver } from '@app/unraid-api/graph/resolvers/ups/ups.resolver.js';
import { UPSService } from '@app/unraid-api/graph/resolvers/ups/ups.service.js';

@Module({
    providers: [UPSResolver, UPSService, { provide: PubSub, useValue: new PubSub() }],
})
export class UPSModule {}
