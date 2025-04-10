import { BadRequestException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import {
    ArrayDisk,
    ArrayDiskInput,
    ArrayStateInput,
    UnraidArray,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { ArrayMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => ArrayMutations)
export class ArrayMutationsResolver {
    constructor(private readonly arrayService: ArrayService) {}

    @Mutation(() => UnraidArray, { description: 'Set array state' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async setState(@Args('input') input: ArrayStateInput): Promise<UnraidArray> {
        return this.arrayService.updateArrayState(input);
    }

    @Mutation(() => UnraidArray, { description: 'Add new disk to array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async addDiskToArray(@Args('input') input: ArrayDiskInput): Promise<UnraidArray> {
        return this.arrayService.addDiskToArray(input);
    }

    @Mutation(() => UnraidArray, {
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

    @Mutation(() => ArrayDisk, { description: 'Mount a disk in the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async mountArrayDisk(@Args('id') id: string): Promise<ArrayDisk> {
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

    @Mutation(() => ArrayDisk, { description: 'Unmount a disk from the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async unmountArrayDisk(@Args('id') id: string): Promise<ArrayDisk> {
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

    @Mutation(() => Boolean, { description: 'Clear statistics for a disk in the array' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    public async clearArrayDiskStatistics(@Args('id') id: string): Promise<boolean> {
        await this.arrayService.clearArrayDiskStatistics(id);
        return true;
    }
}
