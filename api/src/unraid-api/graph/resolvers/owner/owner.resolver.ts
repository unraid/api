import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getters } from '@app/store/index.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Owner } from '@app/unraid-api/graph/resolvers/owner/owner.model.js';

@Resolver(() => Owner)
export class OwnerResolver {
    @Query(() => Owner)
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

    @Subscription(() => Owner)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.OWNER,
        possession: AuthPossession.ANY,
    })
    public ownerSubscription() {
        return createSubscription(PUBSUB_CHANNEL.OWNER);
    }
}
