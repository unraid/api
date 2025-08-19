import { GraphQLISODateTime, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { getMachineId } from '@app/core/utils/misc/get-machine-id.js';
import { InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { InfoDevices } from '@app/unraid-api/graph/resolvers/info/devices/devices.model.js';
import { InfoDisplay } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { Info } from '@app/unraid-api/graph/resolvers/info/info.model.js';
import { InfoMemory } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { InfoOs } from '@app/unraid-api/graph/resolvers/info/os/os.model.js';
import { InfoBaseboard, InfoSystem } from '@app/unraid-api/graph/resolvers/info/system/system.model.js';
import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => Info)
export class InfoResolver {
    constructor() {}

    @Query(() => Info)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async info(): Promise<Partial<Info>> {
        return {
            id: 'info',
        };
    }

    @ResolveField(() => GraphQLISODateTime)
    public async time(): Promise<Date> {
        return new Date();
    }

    @ResolveField(() => InfoBaseboard)
    public baseboard(): Partial<InfoBaseboard> {
        // Return minimal stub, let BaseboardResolver handle all fields
        return { id: 'info/baseboard' };
    }

    @ResolveField(() => InfoCpu)
    public cpu(): Partial<InfoCpu> {
        // Return minimal stub, let InfoCpuResolver handle all fields
        return { id: 'info/cpu' };
    }

    @ResolveField(() => InfoDevices)
    public devices(): Partial<InfoDevices> {
        // Return minimal stub, let InfoDevicesResolver handle all fields
        return { id: 'info/devices' };
    }

    @ResolveField(() => InfoDisplay)
    public display(): Partial<InfoDisplay> {
        // Return minimal stub, let InfoDisplayResolver handle all fields
        return { id: 'info/display' };
    }

    @ResolveField(() => String, { nullable: true })
    public async machineId(): Promise<string | undefined> {
        return getMachineId();
    }

    @ResolveField(() => InfoMemory)
    public memory(): Partial<InfoMemory> {
        // Return minimal stub, let InfoMemoryResolver handle all fields
        return { id: 'info/memory' };
    }

    @ResolveField(() => InfoOs)
    public os(): Partial<InfoOs> {
        // Return minimal stub, let OsResolver handle all fields
        return { id: 'info/os' };
    }

    @ResolveField(() => InfoSystem)
    public system(): Partial<InfoSystem> {
        // Return minimal stub, let SystemResolver handle all fields
        return { id: 'info/system' };
    }

    @ResolveField(() => InfoVersions)
    public versions(): Partial<InfoVersions> {
        // Return minimal stub, let VersionsResolver handle all fields
        return { id: 'info/versions' };
    }
}
