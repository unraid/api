import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { InfoCpuResolver } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.resolver.js';
import { CpuDataService, CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { DevicesResolver } from '@app/unraid-api/graph/resolvers/info/devices/devices.resolver.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices/devices.service.js';
import { InfoDisplayResolver } from '@app/unraid-api/graph/resolvers/info/display/display.resolver.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoMemoryResolver } from '@app/unraid-api/graph/resolvers/info/memory/memory.resolver.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { OsResolver } from '@app/unraid-api/graph/resolvers/info/os/os.resolver.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';
import { SystemResolver } from '@app/unraid-api/graph/resolvers/info/system/system.resolver.js';
import { VersionsResolver } from '@app/unraid-api/graph/resolvers/info/versions/versions.resolver.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ConfigModule, ServicesModule],
    providers: [
        // Main resolver
        InfoResolver,

        // Sub-resolvers
        InfoCpuResolver,
        InfoMemoryResolver,
        DevicesResolver,
        InfoDisplayResolver,
        SystemResolver,
        OsResolver,
        VersionsResolver,

        // Services
        CpuService,
        CpuDataService,
        MemoryService,
        DevicesService,
        OsService,
        VersionsService,
        DisplayService,
    ],
    exports: [
        InfoResolver,
        InfoCpuResolver,
        InfoMemoryResolver,
        DevicesResolver,
        InfoDisplayResolver,
        SystemResolver,
        OsResolver,
        VersionsResolver,
        DisplayService,
    ],
})
export class InfoModule {}
