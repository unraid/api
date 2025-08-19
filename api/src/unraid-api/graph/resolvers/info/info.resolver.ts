import { GraphQLISODateTime, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';
import { baseboard as getBaseboard, system as getSystem } from 'systeminformation';

import { getMachineId } from '@app/core/utils/misc/get-machine-id.js';
import { InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { InfoDevices } from '@app/unraid-api/graph/resolvers/info/devices/devices.model.js';
import { InfoDisplay } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { Info } from '@app/unraid-api/graph/resolvers/info/info.model.js';
import { InfoMemory } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { InfoOs } from '@app/unraid-api/graph/resolvers/info/os/os.model.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';
import { InfoBaseboard, InfoSystem } from '@app/unraid-api/graph/resolvers/info/system/system.model.js';
import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';

@Resolver(() => Info)
export class InfoResolver {
    constructor(
        private readonly cpuService: CpuService,
        private readonly memoryService: MemoryService,
        private readonly displayService: DisplayService,
        private readonly osService: OsService,
        private readonly versionsService: VersionsService
    ) {}

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
    public async baseboard(): Promise<InfoBaseboard> {
        const baseboard = await getBaseboard();
        return { id: 'info/baseboard', ...baseboard } as InfoBaseboard;
    }

    @ResolveField(() => InfoCpu)
    public async cpu(): Promise<InfoCpu> {
        return this.cpuService.generateCpu();
    }

    @ResolveField(() => InfoDevices)
    public devices(): Partial<InfoDevices> {
        // Return minimal stub, let InfoDevicesResolver handle all fields
        return { id: 'info/devices' };
    }

    @ResolveField(() => InfoDisplay)
    public async display(): Promise<InfoDisplay> {
        return this.displayService.generateDisplay();
    }

    @ResolveField(() => String, { nullable: true })
    public async machineId(): Promise<string | undefined> {
        return getMachineId();
    }

    @ResolveField(() => InfoMemory)
    public async memory(): Promise<InfoMemory> {
        return this.memoryService.generateMemory();
    }

    @ResolveField(() => InfoOs)
    public async os(): Promise<InfoOs> {
        return this.osService.generateOs();
    }

    @ResolveField(() => InfoSystem)
    public async system(): Promise<InfoSystem> {
        const system = await getSystem();
        return { id: 'info/system', ...system } as InfoSystem;
    }

    @ResolveField(() => InfoVersions)
    public async versions(): Promise<InfoVersions> {
        return this.versionsService.generateVersions();
    }
}
