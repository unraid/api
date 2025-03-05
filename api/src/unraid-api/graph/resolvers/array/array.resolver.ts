import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getArrayData } from '@app/core/modules/array/get-array-data.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { store } from '@app/store/index.js';

@Resolver('Array')
export class ArrayResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async array() {
        return getArrayData(store.getState);
    }

    @Subscription('array')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async arraySubscription() {
        return createSubscription(PUBSUB_CHANNEL.ARRAY);
    }
}
