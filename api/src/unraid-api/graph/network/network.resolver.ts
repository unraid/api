import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { AccessUrl, Network, Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { getServerIps } from '@app/core/modules/network.js';

@Resolver('Network')
export class NetworkResolver {
    constructor() {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.NETWORK,
        possession: AuthPossession.ANY,
    })
    @Query('network')
    public async network(): Promise<Network> {
        return {
            id: 'network',
        };
    }

    @ResolveField()
    public async accessUrls(): Promise<AccessUrl[]> {
        const ips = await getServerIps();
        return ips.urls;
    }
}
