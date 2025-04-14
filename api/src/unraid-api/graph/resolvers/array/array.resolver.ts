import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { UnraidArray } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';

@Resolver('Array')
export class ArrayResolver {
    constructor(private readonly arrayService: ArrayService) {}

    @Query(() => UnraidArray)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async array() {
        return this.arrayService.getArrayData();
    }

    @Subscription(() => UnraidArray)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async arraySubscription() {
        return createSubscription(PUBSUB_CHANNEL.ARRAY);
    }
}
