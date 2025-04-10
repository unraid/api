import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { VmMutations } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver(() => VmMutations)
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Start a virtual machine' })
    async startVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.startVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Stop a virtual machine' })
    async stopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.stopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Pause a virtual machine' })
    async pauseVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.pauseVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Resume a virtual machine' })
    async resumeVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resumeVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Force stop a virtual machine' })
    async forceStopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.forceStopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Reboot a virtual machine' })
    async rebootVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.rebootVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean, { description: 'Reset a virtual machine' })
    async resetVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resetVm(id);
    }
}
