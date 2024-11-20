import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getArrayData } from '@app/core/modules/array/get-array-data';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { Resource } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';

@Resolver('Array')
export class ArrayResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.OWN,
    })
    public async array() {
        return getArrayData(store.getState);
    }

    @Subscription('array')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ARRAY,
        possession: AuthPossession.OWN,
    })
    public async arraySubscription() {
        return createSubscription(PUBSUB_CHANNEL.ARRAY);
    }
}
