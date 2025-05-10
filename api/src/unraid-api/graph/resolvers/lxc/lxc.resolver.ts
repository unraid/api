import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { Lxc, LxcContainer } from '@app/unraid-api/graph/resolvers/lxc/lxc.model.js';
import { LxcService } from '@app/unraid-api/graph/resolvers/lxc/lxc.service.js';

@Resolver(() => Lxc)
export class LxcResolver {
    constructor(private readonly lxcService: LxcService) {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.LXC,
        possession: AuthPossession.ANY,
    })
    @Query(() => Lxc)
    public lxc() {
        return {
            id: 'lxc',
        };
    }

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.LXC,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => [LxcContainer])
    public async containers() {
        return this.lxcService.getContainers();
    }
}
