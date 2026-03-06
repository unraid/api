import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Disk, DiskInterfaceType } from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { DiskSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/disk_sensors.service.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

describe('DiskSensorsService', () => {
    let service: DiskSensorsService;
    let disksService: DisksService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DiskSensorsService,
                {
                    provide: DisksService,
                    useValue: {
                        getDisks: vi.fn(),
                        getTemperature: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DiskSensorsService>(DiskSensorsService);
        disksService = module.get<DisksService>(DisksService);
    });

    describe('isAvailable', () => {
        it('should return true when disks exist', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                { id: 'disk1', device: '/dev/sda', name: 'Test Disk' } as unknown as Disk,
            ]);

            const available = await service.isAvailable();
            expect(available).toBe(true);
        });

        it('should return false when no disks exist', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([]);

            const available = await service.isAvailable();
            expect(available).toBe(false);
        });

        it('should return false when DisksService throws', async () => {
            vi.mocked(disksService.getDisks).mockRejectedValue(new Error('Failed'));

            const available = await service.isAvailable();
            expect(available).toBe(false);
        });
    });

    describe('read', () => {
        it('should return disk temperatures', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                {
                    id: 'disk1',
                    device: '/dev/sda',
                    name: 'Seagate HDD',
                    interfaceType: DiskInterfaceType.SATA,
                } as unknown as Disk,
                {
                    id: 'disk2',
                    device: '/dev/nvme0n1',
                    name: 'Samsung NVMe',
                    interfaceType: DiskInterfaceType.PCIE,
                } as unknown as Disk,
            ]);

            vi.mocked(disksService.getTemperature).mockResolvedValueOnce(35).mockResolvedValueOnce(45);

            const sensors = await service.read();

            expect(sensors).toHaveLength(2);
            expect(sensors[0]).toEqual({
                id: 'disk:disk1',
                name: 'Seagate HDD',
                type: SensorType.DISK,
                value: 35,
                unit: TemperatureUnit.CELSIUS,
            });
            expect(sensors[1]).toEqual({
                id: 'disk:disk2',
                name: 'Samsung NVMe',
                type: SensorType.NVME,
                value: 45,
                unit: TemperatureUnit.CELSIUS,
            });
        });

        it('should skip disks without temperature data', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                { id: 'disk1', device: '/dev/sda', name: 'Disk 1' } as unknown as Disk,
                { id: 'disk2', device: '/dev/sdb', name: 'Disk 2' } as unknown as Disk,
            ]);

            vi.mocked(disksService.getTemperature).mockResolvedValueOnce(35).mockResolvedValueOnce(null); // No temp for disk2

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toBe('Disk 1');
        });

        it('should handle getTemperature errors gracefully', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                { id: 'disk1', device: '/dev/sda', name: 'Disk 1' } as unknown as Disk,
                { id: 'disk2', device: '/dev/sdb', name: 'Disk 2' } as unknown as Disk,
            ]);

            vi.mocked(disksService.getTemperature)
                .mockResolvedValueOnce(35)
                .mockRejectedValueOnce(new Error('SMART failed'));

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toBe('Disk 1');
        });

        it('should use device name as fallback when name is empty', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                { id: 'disk1', device: '/dev/sda', name: '' } as unknown as Disk,
            ]);

            vi.mocked(disksService.getTemperature).mockResolvedValue(35);

            const sensors = await service.read();

            expect(sensors[0].name).toBe('/dev/sda');
        });
    });

    describe('inferDiskType', () => {
        it('should return NVME for nvme interface', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                {
                    id: 'disk1',
                    device: '/dev/nvme0n1',
                    name: 'NVMe',
                    interfaceType: DiskInterfaceType.PCIE,
                } as unknown as Disk,
            ]);
            vi.mocked(disksService.getTemperature).mockResolvedValue(40);

            const sensors = await service.read();
            expect(sensors[0].type).toBe(SensorType.NVME);
        });

        it('should return NVME for pcie interface', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                {
                    id: 'disk1',
                    device: '/dev/nvme0n1',
                    name: 'NVMe',
                    interfaceType: DiskInterfaceType.PCIE,
                } as unknown as Disk,
            ]);
            vi.mocked(disksService.getTemperature).mockResolvedValue(40);

            const sensors = await service.read();
            expect(sensors[0].type).toBe(SensorType.NVME);
        });

        it('should return DISK for sata interface', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                {
                    id: 'disk1',
                    device: '/dev/sda',
                    name: 'HDD',
                    interfaceType: DiskInterfaceType.SATA,
                } as unknown as Disk,
            ]);
            vi.mocked(disksService.getTemperature).mockResolvedValue(35);

            const sensors = await service.read();
            expect(sensors[0].type).toBe(SensorType.DISK);
        });

        it('should return DISK for undefined interface', async () => {
            vi.mocked(disksService.getDisks).mockResolvedValue([
                { id: 'disk1', device: '/dev/sda', name: 'HDD' } as unknown as Disk,
            ]);
            vi.mocked(disksService.getTemperature).mockResolvedValue(35);

            const sensors = await service.read();
            expect(sensors[0].type).toBe(SensorType.DISK);
        });
    });
});
