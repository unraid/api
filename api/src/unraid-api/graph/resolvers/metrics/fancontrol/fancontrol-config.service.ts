import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';

import { FanControlConfig } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

@Injectable()
export class FanControlConfigService extends ConfigFilePersister<FanControlConfig> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    enabled(): boolean {
        return true;
    }

    configKey(): string {
        return 'fanControl';
    }

    fileName(): string {
        return 'fancontrol.json';
    }

    defaultConfig(): FanControlConfig {
        return {
            enabled: true,
            control_enabled: false,
            polling_interval: 2000,
            control_method: 'auto',
            safety: {
                min_speed_percent: 20,
                cpu_min_speed_percent: 30,
                max_temp_before_full: 85,
                fan_failure_threshold: 0,
            },
        };
    }

    async validate(config: object): Promise<FanControlConfig> {
        return validateObject(FanControlConfig, config);
    }
}
