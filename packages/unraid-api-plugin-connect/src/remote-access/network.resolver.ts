import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { AccessUrl } from '@unraid/shared/network.model.js';
import { Network } from '../connect/connect.model.js';
import { UrlResolverService } from '../system/url-resolver.service.js';

@Resolver(() => Network)
export class NetworkResolver {
    constructor(private readonly urlResolverService: UrlResolverService) {}

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
        const ips = this.urlResolverService.getServerIps();
        return ips.urls.map((url) => ({
            type: url.type,
            name: url.name,
            ipv4: url.ipv4,
            ipv6: url.ipv6,
        }));
    }
}
