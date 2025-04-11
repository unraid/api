import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { getServerIps } from '@app/graphql/resolvers/subscription/network.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { AccessUrl, Network } from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

@Resolver(() => Network)
export class NetworkResolver {
    constructor() {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.NETWORK,
        possession: AuthPossession.ANY,
    })
    @Query(() => Network)
    public async network(): Promise<Network> {
        return {
            id: 'network',
        };
    }

    @ResolveField(() => [AccessUrl])
    public async accessUrls(): Promise<AccessUrl[]> {
        const ips = await getServerIps();
        return ips.urls.map((url) => ({
            type: url.type,
            name: url.name,
            ipv4: url.ipv4,
            ipv6: url.ipv6,
        }));
    }
}
