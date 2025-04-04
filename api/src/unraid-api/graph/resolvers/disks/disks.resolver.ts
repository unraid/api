import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Resolver('Disks')
export class DisksResolver {
    constructor(private readonly disksService: DisksService) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISK,
        possession: AuthPossession.ANY,
    })
    public async disks() {
        const disks = await this.disksService.getDisks({ temperature: true });
        return disks;
    }
}
