import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { execa } from 'execa';

import {
    RawTemperatureSensor,
    TemperatureSensorProvider,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/sensor.interface.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@Injectable()
export class IpmiSensorsService implements TemperatureSensorProvider {
    readonly id = 'ipmi-sensors';
    private readonly logger = new Logger(IpmiSensorsService.name);
    private readonly timeoutMs = 3000;

    constructor(private readonly configService: ConfigService) {}

    async isAvailable(): Promise<boolean> {
        try {
            await execa('ipmitool', ['-V'], { timeout: this.timeoutMs });
            return true;
        } catch {
            return false;
        }
    }

    async read(): Promise<RawTemperatureSensor[]> {
        // We can add config for arguments if needed, similar to lm-sensors

        try {
            // 'sdr type temperature' returns sensors specifically for temperature
            const { stdout } = await execa('ipmitool', ['sdr', 'type', 'temperature'], {
                timeout: this.timeoutMs,
            });

            return this.parseIpmiOutput(stdout);
        } catch (err) {
            this.logger.error('Failed to read IPMI sensors', err);
            return [];
        }
    }

    private parseIpmiOutput(output: string): RawTemperatureSensor[] {
        const sensors: RawTemperatureSensor[] = [];
        const lines = output.split('\n');

        // Example output line:
        // CPU Temp         | 40 degrees C      | ok
        // System Temp      | 35 degrees C      | ok

        for (const line of lines) {
            const [name, reading] = line.split('|').map((s) => s.trim());

            if (!name || reading === undefined) continue;

            const [valueStr, ...unitParts] = reading.split(' ');
            const unitStr = unitParts.join(' ');

            const value = parseFloat(valueStr);

            if (isNaN(value)) continue;

            // Simple unit detection
            let unit = TemperatureUnit.CELSIUS;
            if (unitStr.toLowerCase().includes('f')) {
                unit = TemperatureUnit.FAHRENHEIT;
            }

            sensors.push({
                id: `ipmi:${name.replace(/\s+/g, '_').toLowerCase()}`,
                name,
                type: this.inferType(name),
                value,
                unit,
            });
        }

        return sensors;
    }

    private inferType(name: string): SensorType {
        const n = name.toLowerCase();
        if (n.includes('cpu')) return SensorType.CPU_PACKAGE;
        if (n.includes('system') || n.includes('ambient')) return SensorType.MOTHERBOARD;
        if (n.includes('fan')) return SensorType.CUSTOM; // Should not happen with 'type temperature'
        return SensorType.CUSTOM;
    }
}
