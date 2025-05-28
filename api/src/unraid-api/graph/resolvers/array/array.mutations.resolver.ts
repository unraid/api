import { BadRequestException } from '@nestjs/common';
import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import {
    ArrayDisk,
    ArrayDiskInput,
    ArrayStateInput,
    UnraidArray,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { Resource } from '@unraid/shared/graphql.model.js';
import { ArrayMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => ArrayMutations)
export class ArrayMutationsResolver {
    constructor(private readonly arrayService: ArrayService) {}

    @ResolveField(() => UnraidArray, { description: 'Set array state' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async setState(@Args('input') input: ArrayStateInput): Promise<UnraidArray> {
        return this.arrayService.updateArrayState(input);
    }

    @ResolveField(() => UnraidArray, { description: 'Add new disk to array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async addDiskToArray(@Args('input') input: ArrayDiskInput): Promise<UnraidArray> {
        return this.arrayService.addDiskToArray(input);
    }

    @ResolveField(() => UnraidArray, {
        description:
            "Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error.",
    })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async removeDiskFromArray(@Args('input') input: ArrayDiskInput): Promise<UnraidArray> {
        return this.arrayService.removeDiskFromArray(input);
    }

    @ResolveField(() => ArrayDisk, { description: 'Mount a disk in the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async mountArrayDisk(@Args('id', { type: () => PrefixedID }) id: string): Promise<ArrayDisk> {
        const array = await this.arrayService.mountArrayDisk(id);
        const disk =
            array.disks.find((disk) => disk.id === id) ||
            array.parities.find((disk) => disk.id === id) ||
            array.caches.find((disk) => disk.id === id);

        if (!disk) {
            throw new BadRequestException(`Disk with id ${id} not found in array`);
        }

        return disk;
    }

    @ResolveField(() => ArrayDisk, { description: 'Unmount a disk from the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async unmountArrayDisk(
        @Args('id', { type: () => PrefixedID }) id: string
    ): Promise<ArrayDisk> {
        const array = await this.arrayService.unmountArrayDisk(id);
        const disk =
            array.disks.find((disk) => disk.id === id) ||
            array.parities.find((disk) => disk.id === id) ||
            array.caches.find((disk) => disk.id === id);

        if (!disk) {
            throw new BadRequestException(`Disk with id ${id} not found in array`);
        }

        return disk;
    }

    @ResolveField(() => Boolean, { description: 'Clear statistics for a disk in the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async clearArrayDiskStatistics(
        @Args('id', { type: () => PrefixedID }) id: string
    ): Promise<boolean> {
        await this.arrayService.clearArrayDiskStatistics(id);
        return true;
    }
}
