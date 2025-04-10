import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { PubSub } from 'graphql-subscriptions';

import { PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { ParityCheck } from '@app/unraid-api/graph/resolvers/array/parity.model.js';

const pubSub = new PubSub();

@Resolver(() => ParityCheck)
export class ParityResolver {
    @Query(() => [ParityCheck])
    async parityHistory(): Promise<ParityCheck[]> {
        throw new Error('Not implemented');
    }

    @Mutation(() => Object)
    async startParityCheck(@Args('correct') correct: boolean): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => Object)
    async pauseParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => Object)
    async resumeParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => Object)
    async cancelParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Subscription(() => ParityCheck)
    parityHistorySubscription() {
        return pubSub.asyncIterableIterator(PUBSUB_CHANNEL.PARITY);
    }
}
