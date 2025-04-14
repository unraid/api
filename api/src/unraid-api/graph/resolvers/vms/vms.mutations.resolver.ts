import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { VmMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => VmMutations)
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Start a virtual machine' })
    async start(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.startVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Stop a virtual machine' })
    async stop(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.stopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Pause a virtual machine' })
    async pause(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.pauseVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Resume a virtual machine' })
    async resume(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.resumeVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Force stop a virtual machine' })
    async forceStop(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.forceStopVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Reboot a virtual machine' })
    async reboot(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.rebootVm(id);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Reset a virtual machine' })
    async reset(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
        return this.vmsService.resetVm(id);
    }
}
