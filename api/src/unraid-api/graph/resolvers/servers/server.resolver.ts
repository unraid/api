import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getLocalServer } from '@app/graphql/schema/utils.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@unraid/shared/graphql.model.js';
import { Server as ServerModel } from '@app/unraid-api/graph/resolvers/servers/server.model.js';

@Resolver(() => ServerModel)
export class ServerResolver {
    @Query(() => ServerModel, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async server(): Promise<ServerModel | null> {
        return getLocalServer()[0];
    }

    @Query(() => [ServerModel])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async servers(): Promise<ServerModel[]> {
        return getLocalServer();
    }

    @Subscription(() => ServerModel)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async serversSubscription() {
        return createSubscription(PUBSUB_CHANNEL.SERVERS);
    }
}
