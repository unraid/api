import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';
import { z } from 'zod';

import {
    RawTemperatureSensor,
    TemperatureSensorProvider,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/sensor.interface.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

const LmSensorsSchema = z.record(z.string(), z.record(z.string(), z.unknown()));

@Injectable()
export class LmSensorsService implements TemperatureSensorProvider {
    readonly id = 'LinuxMonitorSensorService';
    private readonly logger = new Logger(LmSensorsService.name);
    private readonly timeoutMs = 3000;

    constructor(private readonly configService: TemperatureConfigService) {}

    async isAvailable(): Promise<boolean> {
        try {
            await execa('sensors', ['--version'], { timeout: this.timeoutMs });
            return true;
        } catch {
            return false;
        }
    }

    async read(): Promise<RawTemperatureSensor[]> {
        const configPath = this.configService.getConfig().sensors?.lm_sensors?.config_path;

        const args = ['-j'];
        if (configPath) {
            args.push('-c', configPath);
        }

        const { stdout } = await execa('sensors', args, { timeout: this.timeoutMs });
        const parsedData = LmSensorsSchema.safeParse(JSON.parse(stdout));

        if (!parsedData.success) return [];

        const data = parsedData.data;
        const sensors: RawTemperatureSensor[] = [];

        for (const [chipName, chip] of Object.entries(data)) {
            for (const [label, values] of Object.entries(chip)) {
                if (label === 'Adapter' || typeof values !== 'object' || values === null) continue;

                for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
                    if (!key.endsWith('_input') || typeof value !== 'number') continue;

                    const name = `${chipName} ${label}`;

                    sensors.push({
                        id: `${chipName}:${label}:${key}`,
                        name,
                        type: this.inferType(name),
                        value,
                        unit: TemperatureUnit.CELSIUS,
                    });
                }
            }
        }

        return sensors;
    }

    private inferType(name: string): SensorType {
        const n = name.toLowerCase();
        if (n.includes('package')) return SensorType.CPU_PACKAGE;
        if (n.includes('core')) return SensorType.CPU_CORE;
        if (n.includes('nvme')) return SensorType.NVME;
        if (n.includes('gpu')) return SensorType.GPU;
        if (n.includes('wmi')) return SensorType.MOTHERBOARD;
        return SensorType.CUSTOM;
    }
}
