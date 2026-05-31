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

// lm-sensors exposes voltages (inN_input), fans (fanN_input), power, etc. alongside
// temperatures (tempN_input). Only temperature channels belong in this provider.
const TEMP_INPUT_KEY = /^temp\d+_input$/;

// Physically implausible readings (e.g. nct6xxx TSI channels reporting ~3.9M °C, or
// disconnected thermistors) are dropped so they can't be selected as fan-curve inputs.
const MIN_VALID_TEMP_C = -40;
const MAX_VALID_TEMP_C = 200;

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
                    if (!TEMP_INPUT_KEY.test(key) || typeof value !== 'number') continue;

                    if (value < MIN_VALID_TEMP_C || value > MAX_VALID_TEMP_C) {
                        this.logger.debug(
                            `Skipping out-of-range temperature ${chipName} ${label}: ${value}°C`
                        );
                        continue;
                    }

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
