import { ConfigService } from '@nestjs/config';
import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { createSubscription } from '@app/core/pubsub.js';
import { Owner } from '@app/unraid-api/graph/resolvers/owner/owner.model.js';

// Question: should we move this into the connect plugin, or should this always be available?
@Resolver(() => Owner)
export class OwnerResolver {
    constructor(private readonly configService: ConfigService) {}
    @Query(() => Owner)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.OWNER,
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
        action: AuthAction.READ_ANY,
        resource: Resource.OWNER,
    })
    public ownerSubscription() {
        return createSubscription(GRAPHQL_PUBSUB_CHANNEL.OWNER);
    }
}
