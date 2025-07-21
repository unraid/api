import { Module } from '@nestjs/common';
import { UPSResolver } from './ups.resolver.js';
import { UPSService } from './ups.service.js';
import { PubSub } from 'graphql-subscriptions';

@Module({
  providers: [UPSResolver, UPSService, { provide: PubSub, useValue: new PubSub() }],
})
export class UPSModule {}
