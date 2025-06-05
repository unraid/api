import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { Disk } from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Resolver(() => Disk)
export class DisksResolver {
    constructor(private readonly disksService: DisksService) {}

    @Query(() => [Disk])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISK,
        possession: AuthPossession.ANY,
    })
    public async disks() {
        return this.disksService.getDisks();
    }

    @Query(() => Disk)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISK,
        possession: AuthPossession.ANY,
    })
    public async disk(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.disksService.getDisk(id);
    }

    @ResolveField(() => Int)
    public async temperature(@Parent() disk: Disk) {
        return this.disksService.getTemperature(disk.device);
    }
}
