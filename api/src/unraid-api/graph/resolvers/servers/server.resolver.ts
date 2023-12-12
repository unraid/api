import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { getLocalServer } from '@app/graphql/schema/utils';
import { type Server } from '@app/graphql/generated/client/graphql';
import { UseRoles } from 'nest-access-control';
import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';

@Resolver()
export class ServerResolver {
    @Query()
    @UseRoles({
        resource: 'server',
        action: 'read',
        possession: 'any',
    })
    public async server(): Promise<Server | null> {
        return getLocalServer()[0];
    }

    @Resolver('servers')
    @Query()
    @UseRoles({
        resource: 'server',
        action: 'read',
        possession: 'any',
    })
    public async servers(): Promise<Server[]> {
        return getLocalServer();
    }

    @Subscription('server')
    @UseRoles({
        resource: 'server',
        action: 'read',
        possession: 'any',
    })
    public async serversSubscription() {
        return createSubscription(PUBSUB_CHANNEL.SERVERS);
    }
}
