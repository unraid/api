import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver('VmMutations')
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('startVm')
    async startVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.startVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('stopVm')
    async stopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.stopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('pauseVm')
    async pauseVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.pauseVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('resumeVm')
    async resumeVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resumeVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('forceStopVm')
    async forceStopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.forceStopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('rebootVm')
    async rebootVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.rebootVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField('resetVm')
    async resetVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resetVm(id);
    }
}
