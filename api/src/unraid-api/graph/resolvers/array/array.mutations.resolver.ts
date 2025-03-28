import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import {
    ArrayDiskInput,
    ArrayMutations,
    ArrayStateInput,
    Resource,
} from '@app/graphql/generated/api/types.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';

@Resolver('ArrayMutations')
export class ArrayMutationsResolver {
    constructor(private readonly arrayService: ArrayService) {}

    @ResolveField('setState')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async setState(@Args('input') input: ArrayStateInput) {
        return this.arrayService.updateArrayState(input);
    }

    @ResolveField('addDiskToArray')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async addDiskToArray(@Args('input') input: ArrayDiskInput) {
        return this.arrayService.addDiskToArray(input);
    }

    @ResolveField('removeDiskFromArray')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async removeDiskFromArray(@Args('input') input: ArrayDiskInput) {
        return this.arrayService.removeDiskFromArray(input);
    }

    @ResolveField('mountArrayDisk')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async mountArrayDisk(@Args('id') id: string) {
        return this.arrayService.mountArrayDisk(id);
    }

    @ResolveField('unmountArrayDisk')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async unmountArrayDisk(@Args('id') id: string) {
        return this.arrayService.unmountArrayDisk(id);
    }

    @ResolveField('clearArrayDiskStatistics')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async clearArrayDiskStatistics(@Args('id') id: string) {
        return this.arrayService.clearArrayDiskStatistics(id);
    }
}
