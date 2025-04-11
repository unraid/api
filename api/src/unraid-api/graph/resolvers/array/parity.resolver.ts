import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { PubSub } from 'graphql-subscriptions';

import { PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { ParityCheck } from '@app/unraid-api/graph/resolvers/array/parity.model.js';
import { ParityService } from '@app/unraid-api/graph/resolvers/array/parity.service.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';

const pubSub = new PubSub();

@Resolver(() => ParityCheck)
export class ParityResolver {
    constructor(
        private readonly arrayService: ArrayService,
        private readonly parityService: ParityService
    ) {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @Query(() => [ParityCheck])
    async parityHistory(): Promise<ParityCheck[]> {
        return await this.parityService.getParityHistory();
    }

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @Subscription(() => ParityCheck)
    parityHistorySubscription() {
        return pubSub.asyncIterableIterator(PUBSUB_CHANNEL.PARITY);
    }
}
