import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { VmMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => VmMutations)
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Start a virtual machine' })
    async start(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.startVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Stop a virtual machine' })
    async stop(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.stopVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Pause a virtual machine' })
    async pause(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.pauseVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Resume a virtual machine' })
    async resume(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.resumeVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Force stop a virtual machine' })
    async forceStop(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.forceStopVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Reboot a virtual machine' })
    async reboot(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.rebootVm(id);
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VMS,
    })
    @ResolveField(() => Boolean, { description: 'Reset a virtual machine' })
    async reset(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.resetVm(id);
    }
}
