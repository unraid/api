import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Owner } from '@app/unraid-api/graph/resolvers/owner/owner.model.js';
import { ConfigService } from '@nestjs/config';

// Question: should we move this into the connect plugin, or should this always be available?
@Resolver(() => Owner)
export class OwnerResolver {
    constructor(private readonly configService: ConfigService) {}
    @Query(() => Owner)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.OWNER,
        possession: AuthPossession.ANY,
    })
    public async owner() {
        const config = this.configService.get('connect.config');

        if (!config?.username) {
            return {
                username: 'root',
                avatar: '',
                url: '',
            };
        }

        return {
            username: config.username,
            avatar: config.avatar,
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
