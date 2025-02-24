import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { Resource } from '@app/graphql/generated/api/types.js';
import { type Server } from '@app/graphql/generated/client/graphql.js';
import { getLocalServer } from '@app/graphql/schema/utils.js';

@Resolver('Server')
export class ServerResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async server(): Promise<Server | null> {
        return getLocalServer()[0];
    }

    @Resolver('servers')
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async servers(): Promise<Server[]> {
        return getLocalServer();
    }

    @Subscription('server')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async serversSubscription() {
        return createSubscription(PUBSUB_CHANNEL.SERVERS);
    }
}
