import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-scalars';
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

    @Mutation(() => GraphQLJSON)
    async startParityCheck(@Args('correct') correct: boolean): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => GraphQLJSON)
    async pauseParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => GraphQLJSON)
    async resumeParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Mutation(() => GraphQLJSON)
    async cancelParityCheck(): Promise<object> {
        throw new Error('Not implemented');
    }

    @Subscription(() => ParityCheck)
    parityHistorySubscription() {
        return pubSub.asyncIterableIterator(PUBSUB_CHANNEL.PARITY);
    }
}
