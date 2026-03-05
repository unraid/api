// temperature/temperature.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DisksModule } from '@app/unraid-api/graph/resolvers/disks/disks.module.js';
import { DiskSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/disk_sensors.service.js';
import { IpmiSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/ipmi_sensors.service.js';
import { LmSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/lm_sensors.service.js';
import { TemperatureHistoryService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature_history.service.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

@Module({
    imports: [DisksModule],
    providers: [
        {
            provide: TemperatureConfigService,
            useFactory: async (configService: ConfigService) => {
                const service = new TemperatureConfigService(configService);
                await service.onModuleInit();
                return service;
            },
            inject: [ConfigService],
        },
        TemperatureService,
        LmSensorsService,
        DiskSensorsService,
        IpmiSensorsService,
        // (@mitchellthompkins) Add other services here
        // GpuSensorsService,
        TemperatureHistoryService,
    ],
    exports: [TemperatureService, TemperatureConfigService],
})
export class TemperatureModule {}
