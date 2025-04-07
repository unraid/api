import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Disk, Resource } from '@app/graphql/generated/api/types.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Resolver('Disk')
export class DisksResolver {
    constructor(private readonly disksService: DisksService) {}

    @Query('disks')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISK,
        possession: AuthPossession.ANY,
    })
    public async disks() {
        return this.disksService.getDisks();
    }

    @ResolveField('temperature')
    public async temperature(@Parent() disk: Disk) {
        return this.disksService.getTemperature(disk.device);
    }
}
