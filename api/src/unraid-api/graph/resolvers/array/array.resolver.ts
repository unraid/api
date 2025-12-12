import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { createSubscription } from '@app/core/pubsub.js';
import { UnraidArray } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';

@Resolver('Array')
export class ArrayResolver {
    constructor(private readonly arrayService: ArrayService) {}

    @Query(() => UnraidArray)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ARRAY,
    })
    public async array() {
        return this.arrayService.getArrayData();
    }

    @Subscription(() => UnraidArray)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ARRAY,
    })
    public async arraySubscription() {
        return createSubscription(GRAPHQL_PUBSUB_CHANNEL.ARRAY);
    }
}
