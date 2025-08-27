import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { AccessUrl } from '@unraid/shared/network.model.js';
import {
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { Network } from '../unraid-connect/connect.model.js';
import { UrlResolverService } from './url-resolver.service.js';

@Resolver(() => Network)
export class NetworkResolver {
    constructor(private readonly urlResolverService: UrlResolverService) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.NETWORK,
    })
    @Query(() => Network)
    public async network(): Promise<Network> {
        return {
            id: 'network',
        };
    }

    @ResolveField(() => [AccessUrl])
    public async accessUrls(): Promise<AccessUrl[]> {
        const ips = this.urlResolverService.getServerIps();
        return ips.urls.map((url) => ({
            type: url.type,
            name: url.name,
            ipv4: url.ipv4,
            ipv6: url.ipv6,
        }));
    }
}
