import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';

import { TemperatureConfig } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.model.js';
import { TemperatureUnit } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

@Injectable()
export class TemperatureConfigService extends ConfigFilePersister<TemperatureConfig> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    enabled(): boolean {
        return true;
    }

    configKey(): string {
        return 'temperature';
    }

    fileName(): string {
        return 'temperature.json';
    }

    defaultConfig(): TemperatureConfig {
        return {
            enabled: true,
            polling_interval: 5000,
            default_unit: TemperatureUnit.CELSIUS,
            history: {
                max_readings: 1000,
                retention_ms: 86400000,
            },
            sensors: {
                lm_sensors: { enabled: true, config_path: '' },
                smartctl: { enabled: true },
                ipmi: { enabled: true, args: [] },
            },
            thresholds: {
                warning: 80,
                critical: 90,
                cpu_warning: 70,
                cpu_critical: 85,
                disk_warning: 50,
                disk_critical: 60,
            },
        };
    }

    async validate(config: object): Promise<TemperatureConfig> {
        return validateObject(TemperatureConfig, config);
    }
}
