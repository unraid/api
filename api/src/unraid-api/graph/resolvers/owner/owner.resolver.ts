import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { Resource } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

@Resolver('Owner')
export class OwnerResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.OWNER,
        possession: AuthPossession.ANY,
    })
    public async owner() {
        const { remote } = getters.config();

        if (!remote.username) {
            return {
                username: 'root',
                avatar: '',
                url: '',
            };
        }

        return {
            username: remote.username,
            avatar: remote.avatar,
        };
    }

    @Subscription('owner')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.OWNER,
        possession: AuthPossession.ANY,
    })
    public ownerSubscription() {
        return createSubscription(PUBSUB_CHANNEL.OWNER);
    }
}
