import { Injectable, Logger } from '@nestjs/common';

import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import {
    RawTemperatureSensor,
    TemperatureSensorProvider,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/sensor.interface.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@Injectable()
export class DiskSensorsService implements TemperatureSensorProvider {
    readonly id = 'disk-sensors';
    private readonly logger = new Logger(DiskSensorsService.name);

    constructor(private readonly disksService: DisksService) {}

    async isAvailable(): Promise<boolean> {
        // Disks are always "available" since DisksService exists
        try {
            const disks = await this.disksService.getDisks();
            return disks.length > 0;
        } catch {
            return false;
        }
    }

    async read(): Promise<RawTemperatureSensor[]> {
        const disks = await this.disksService.getDisks();
        const sensors: RawTemperatureSensor[] = [];

        for (const disk of disks) {
            try {
                const temp = await this.disksService.getTemperature(disk.device);

                if (temp !== null) {
                    sensors.push({
                        id: `disk:${disk.id}`,
                        name: disk.name || disk.device,
                        type: this.inferDiskType(disk.interfaceType),
                        value: temp,
                        unit: TemperatureUnit.CELSIUS,
                    });
                }
            } catch (err) {
                this.logger.warn(`Failed to get temperature for disk ${disk.device}`, err);
                // Continue with other disks
            }
        }

        return sensors;
    }

    private inferDiskType(interfaceType?: string): SensorType {
        const type = interfaceType?.toLowerCase();
        if (type === 'nvme' || type === 'pcie') {
            return SensorType.NVME;
        }
        return SensorType.DISK;
    }
}
