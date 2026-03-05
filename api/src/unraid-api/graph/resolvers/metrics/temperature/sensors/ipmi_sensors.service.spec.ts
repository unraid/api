import { ConfigService } from '@nestjs/config';

import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IpmiSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/ipmi_sensors.service.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

// Mock execa
vi.mock('execa', async (importOriginal) => {
    const mod = await importOriginal<typeof import('execa')>();
    return {
        ...mod,
        execa: vi.fn(),
    };
});

describe('IpmiSensorsService', () => {
    let service: IpmiSensorsService;
    let configService: ConfigService;

    beforeEach(() => {
        // @ts-expect-error -- mocking partial ConfigService
        configService = {
            get: vi.fn(),
        };

        service = new IpmiSensorsService(configService);
        vi.clearAllMocks();
    });

    describe('isAvailable', () => {
        it('should return true when ipmitool command exists', async () => {
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: 'ipmitool version 1.8.18' });

            const available = await service.isAvailable();

            expect(available).toBe(true);
            expect(execa).toHaveBeenCalledWith(
                'ipmitool',
                ['-V'],
                expect.objectContaining({ timeout: 3000 })
            );
        });

        it('should return false when ipmitool command fails', async () => {
            vi.mocked(execa).mockRejectedValue(new Error('Command not found'));

            const available = await service.isAvailable();

            expect(available).toBe(false);
        });
    });

    describe('read', () => {
        it('should parse IPMI output correctly', async () => {
            const mockOutput =
                'CPU Temp         | 40 degrees C      | ok\n' +
                'System Temp      | 35 degrees C      | ok\n' +
                'Ambient Temp     | 25 degrees C      | ok';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors).toHaveLength(3);

            expect(sensors[0]).toEqual({
                id: 'ipmi:cpu_temp',
                name: 'CPU Temp',
                type: SensorType.CPU_PACKAGE,
                value: 40.0,
                unit: TemperatureUnit.CELSIUS,
            });

            expect(sensors[1]).toEqual({
                id: 'ipmi:system_temp',
                name: 'System Temp',
                type: SensorType.MOTHERBOARD,
                value: 35.0,
                unit: TemperatureUnit.CELSIUS,
            });
            expect(sensors[2]).toEqual({
                id: 'ipmi:ambient_temp',
                name: 'Ambient Temp',
                type: SensorType.MOTHERBOARD,
                value: 25.0,
                unit: TemperatureUnit.CELSIUS,
            });
        });

        it('should handle Fahrenheit units', async () => {
            const mockOutput = 'CPU Temp | 104 degrees F | ok';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].unit).toBe(TemperatureUnit.FAHRENHEIT);
            expect(sensors[0].value).toBe(104.0);
        });

        it('should handle malformed lines', async () => {
            const mockOutput =
                'CPU Temp | 40 degrees C | ok\n' + 'Invalid Line Here\n' + 'Another | Invalid';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toBe('CPU Temp');
        });

        it('should skip non-numeric values', async () => {
            const mockOutput =
                'CPU Temp         | 40 degrees C      | ok\n' +
                'Bad Sensor       | No Reading        | ns';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toBe('CPU Temp');
        });

        it('should return empty array on execution error', async () => {
            vi.mocked(execa).mockRejectedValue(new Error('ipmitool failed'));

            const sensors = await service.read();

            expect(sensors).toEqual([]);
        });

        it('should handle empty output', async () => {
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: '' });

            const sensors = await service.read();

            expect(sensors).toEqual([]);
        });
    });

    describe('inferType', () => {
        it('should return CUSTOM for unknown sensor types', async () => {
            const mockOutput = 'Unknown Sensor | 30 degrees C | ok';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.CUSTOM);
        });

        it('should return MOTHERBOARD for system sensors', async () => {
            const mockOutput = 'System Temp | 30 degrees C | ok';

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: mockOutput });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.MOTHERBOARD);
        });
    });
});
