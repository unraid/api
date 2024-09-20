import { AccessUrl, Network } from '@app/graphql/generated/api/types';
import { getServerIps } from '@app/graphql/resolvers/subscription/network';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Network')
export class NetworkResolver {
    constructor() {}

    @UseRoles({
        resource: 'network',
        action: 'read',
        possession: 'any',
    })
    @Query('network')
    public async network(): Promise<Network> {
        return {
            id: 'network'
        };
    }

    @ResolveField()
    public async accessUrls(): Promise<AccessUrl[]> {
        const ips = await getServerIps();
        return ips.urls;
    }
}
