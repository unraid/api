import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { IpmiFanService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/ipmi_fan.service.js';
import { FanCurveService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-curve.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { FanControlResolver } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.resolver.js';
import { FanControlService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.service.js';
import { TemperatureModule } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.module.js';

@Module({
    imports: [TemperatureModule],
    providers: [
        {
            provide: FanControlConfigService,
            useFactory: async (configService: ConfigService) => {
                const service = new FanControlConfigService(configService);
                await service.onModuleInit();
                return service;
            },
            inject: [ConfigService],
        },
        FanControlService,
        FanControlResolver,
        FanSafetyService,
        FanCurveService,
        HwmonService,
        IpmiFanService,
    ],
    exports: [FanControlService, FanControlConfigService],
})
export class FanControlModule {}
