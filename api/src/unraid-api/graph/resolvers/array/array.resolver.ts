import { getArrayData } from '@app/core/modules/array/get-array-data';
import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';
import { store } from '@app/store/index';
import { Resolver, Query, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Array')
export class ArrayResolver {
    @Query()
    @UseRoles({
        resource: 'array',
        action: 'read',
        possession: 'own'
    })
    public async array() {
        return getArrayData(store.getState);
    }

    @Subscription('array')
    @UseRoles({
        resource: 'array',
        action: 'read',
        possession: 'own'
    })
    public async arraySubscription() {
        return createSubscription(PUBSUB_CHANNEL.ARRAY);
    }
}
