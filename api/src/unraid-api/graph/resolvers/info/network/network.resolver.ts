import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Info } from '@app/unraid-api/graph/resolvers/info/info.model.js';
import { InfoNetworkInterface } from '@app/unraid-api/graph/resolvers/info/network/network.model.js';
import { NetworkService } from '@app/unraid-api/graph/resolvers/info/network/network.service.js';

@Resolver(() => Info)
export class InfoNetworkResolver {
    constructor(private readonly networkService: NetworkService) {}

    @ResolveField(() => [InfoNetworkInterface], { description: 'Network interfaces' })
    async networkInterfaces(): Promise<InfoNetworkInterface[]> {
        return this.networkService.getNetworkInterfaces();
    }

    @ResolveField(() => InfoNetworkInterface, {
        nullable: true,
        description: 'Primary management interface',
    })
    async primaryNetwork(): Promise<InfoNetworkInterface | null> {
        return this.networkService.getManagementInterface();
    }
}
