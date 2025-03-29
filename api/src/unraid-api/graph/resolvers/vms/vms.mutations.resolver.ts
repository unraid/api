import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver('VmMutations')
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @ResolveField('startVm')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    public async startVm(@Args('id') id: number) {
        return this.vmsService.startVm(id);
    }

    @ResolveField('stopVm')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    public async stopVm(@Args('id') id: number) {
        return this.vmsService.stopVm(id);
    }
}
