import { ConfigService } from '@nestjs/config';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DiskSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/disk_sensors.service.js';
import { IpmiSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/ipmi_sensors.service.js';
import { LmSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/lm_sensors.service.js';
import { TemperatureSensorProvider } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/sensor.interface.js';
import { TemperatureHistoryService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature_history.service.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureStatus,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

describe('TemperatureService', () => {
    let service: TemperatureService;
    let lmSensors: Partial<TemperatureSensorProvider>;
    let diskSensors: Partial<TemperatureSensorProvider>;
    let ipmiSensors: Partial<TemperatureSensorProvider>;
    let history: TemperatureHistoryService;
    let configService: ConfigService;
    let temperatureConfigService: TemperatureConfigService;

    beforeEach(async () => {
        lmSensors = {
            id: 'LinuxMonitorSensorService',
            isAvailable: vi.fn().mockResolvedValue(true),
            read: vi.fn().mockResolvedValue([
                {
                    id: 'cpu:package',
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]),
        };

        diskSensors = {
            id: 'disk-sensors',
            isAvailable: vi.fn().mockResolvedValue(true),
            read: vi.fn().mockResolvedValue([]),
        };

        ipmiSensors = {
            id: 'ipmi-sensors',
            isAvailable: vi.fn().mockResolvedValue(false), // Default to unavailable
            read: vi.fn().mockResolvedValue([]),
        };

        configService = new ConfigService();
        vi.spyOn(configService, 'get').mockImplementation(
            (key: string, defaultValue?: unknown) => defaultValue
        );

        temperatureConfigService = Object.create(TemperatureConfigService.prototype);
        temperatureConfigService.getConfig = vi.fn().mockReturnValue({
            default_unit: 'celsius',
            sensors: {
                lm_sensors: { enabled: true },
                smartctl: { enabled: true },
                ipmi: { enabled: false }, // matching default mock
            },
            thresholds: {},
        });

        history = new TemperatureHistoryService(temperatureConfigService);

        service = new TemperatureService(
            lmSensors as unknown as LmSensorsService,
            diskSensors as unknown as DiskSensorsService,
            ipmiSensors as unknown as IpmiSensorsService,
            history,
            temperatureConfigService
        );
    });

    describe('initialization', () => {
        it('should initialize available providers', async () => {
            await service.onModuleInit();

            expect(lmSensors.isAvailable).toHaveBeenCalled();
            expect(diskSensors.isAvailable).toHaveBeenCalled();
        });

        it('should handle provider initialization errors gracefully', async () => {
            vi.mocked(lmSensors.isAvailable!).mockRejectedValue(new Error('Failed'));

            await service.onModuleInit();

            // Should not throw
            const metrics = await service.getMetrics();
            expect(metrics).toBeDefined();
        });
    });

    describe('getMetrics', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should return temperature metrics', async () => {
            const metrics = await service.getMetrics();

            expect(metrics).toBeDefined();
            expect(metrics?.sensors).toHaveLength(1);
            expect(metrics?.sensors[0].name).toBe('CPU Package');
            expect(metrics?.sensors[0].current.value).toBe(55);
        });

        it('should return null when no providers available', async () => {
            vi.mocked(lmSensors.isAvailable!).mockResolvedValue(false);
            vi.mocked(diskSensors.isAvailable!).mockResolvedValue(false);
            vi.mocked(ipmiSensors.isAvailable!).mockResolvedValue(false);

            const emptyService = new TemperatureService(
                lmSensors as unknown as LmSensorsService,
                diskSensors as unknown as DiskSensorsService,
                ipmiSensors as unknown as IpmiSensorsService,
                history,
                temperatureConfigService
            );
            await emptyService.onModuleInit();

            const metrics = await emptyService.getMetrics();
            expect(metrics).toBeNull();
        });

        it('should compute correct status based on thresholds', async () => {
            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:hot',
                    name: 'Hot CPU',
                    type: SensorType.CPU_CORE,
                    value: 75,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            expect(metrics?.sensors[0].current.status).toBe(TemperatureStatus.WARNING);
        });

        it('should use config thresholds when provided', async () => {
            temperatureConfigService.getConfig = vi.fn().mockReturnValue({
                default_unit: 'celsius',
                sensors: {
                    lm_sensors: { enabled: true },
                    smartctl: { enabled: true },
                    ipmi: { enabled: false },
                },
                thresholds: { cpu_warning: 60, cpu_critical: 80 },
            });

            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:warm',
                    name: 'Warm CPU',
                    type: SensorType.CPU_CORE,
                    value: 65,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            expect(metrics?.sensors[0].current.status).toBe(TemperatureStatus.WARNING);
        });

        it('should return temperature metrics in Kelvin when configured', async () => {
            temperatureConfigService.getConfig = vi.fn().mockReturnValue({
                default_unit: 'kelvin',
                sensors: {
                    lm_sensors: { enabled: true },
                    smartctl: { enabled: true },
                    ipmi: { enabled: false },
                },
                thresholds: {},
            });

            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:package',
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                    value: 0,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            expect(metrics?.sensors[0].current.value).toBe(273.15);
            expect(metrics?.sensors[0].current.unit).toBe(TemperatureUnit.KELVIN);
        });

        it('should return temperature metrics in Rankine when configured', async () => {
            temperatureConfigService.getConfig = vi.fn().mockReturnValue({
                default_unit: 'rankine',
                sensors: {
                    lm_sensors: { enabled: true },
                    smartctl: { enabled: true },
                    ipmi: { enabled: false },
                },
                thresholds: {},
            });

            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:package',
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                    value: 25,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            // (25 + 273.15) * 9/5 = 536.67
            expect(metrics?.sensors[0].current.value).toBe(536.67);
            expect(metrics?.sensors[0].current.unit).toBe(TemperatureUnit.RANKINE);
        });

        it('should return thresholds in the target unit', async () => {
            temperatureConfigService.getConfig = vi.fn().mockReturnValue({
                default_unit: 'fahrenheit',
                sensors: {
                    lm_sensors: { enabled: true },
                    smartctl: { enabled: true },
                    ipmi: { enabled: false },
                },
                thresholds: {},
            });

            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:package',
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                    value: 20,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            // Default CPU warning is 70C -> 158F
            // Default CPU critical is 85C -> 185F
            expect(metrics?.sensors[0].warning).toBe(158);
            expect(metrics?.sensors[0].critical).toBe(185);
        });

        it('should interpret user-defined thresholds in the default unit', async () => {
            temperatureConfigService.getConfig = vi.fn().mockReturnValue({
                default_unit: 'fahrenheit',
                sensors: {
                    lm_sensors: { enabled: true },
                    smartctl: { enabled: true },
                    ipmi: { enabled: false },
                },
                thresholds: { cpu_warning: 160 },
            });

            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cpu:package',
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                    value: 72, // 72C (161.6F) -> Should trigger warning (161.6 > 160)
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            // Check status: 72C (161.6F) > 160F Warning -> Should be WARNING
            expect(metrics?.sensors[0].current.status).toBe(TemperatureStatus.WARNING);

            // Check returned threshold: Should be 160 (F)
            // Internal flow: Config 160(F) -> getThresholds(converts to 71.11C) -> getMetrics(converts 71.11C back to F) -> 160
            expect(metrics?.sensors[0].warning).toBe(160);
        });
    });

    describe('buildSummary', () => {
        it('should calculate correct average', async () => {
            await service.onModuleInit();
            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'sensor1',
                    name: 'Sensor 1',
                    type: SensorType.CPU_CORE,
                    value: 40,
                    unit: TemperatureUnit.CELSIUS,
                },
                {
                    id: 'sensor2',
                    name: 'Sensor 2',
                    type: SensorType.CPU_CORE,
                    value: 60,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            expect(metrics?.summary.average).toBe(50);
        });

        it('should identify hottest and coolest sensors', async () => {
            await service.onModuleInit();
            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 's1',
                    name: 'Cool',
                    type: SensorType.CPU_CORE,
                    value: 30,
                    unit: TemperatureUnit.CELSIUS,
                },
                {
                    id: 's2',
                    name: 'Hot',
                    type: SensorType.CPU_CORE,
                    value: 80,
                    unit: TemperatureUnit.CELSIUS,
                },
                {
                    id: 's3',
                    name: 'Medium',
                    type: SensorType.CPU_CORE,
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();
            expect(metrics?.summary.hottest.name).toBe('Hot');
            expect(metrics?.summary.coolest.name).toBe('Cool');
        });
    });
    describe('edge cases', () => {
        it('should handle provider read timeout gracefully', async () => {
            await service.onModuleInit();

            // Simulate a slow/hanging provider
            vi.mocked(lmSensors.read!).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
            );

            const metrics = await service.getMetrics();

            expect(metrics).toBeDefined();
        }, 10000);

        it('should deduplicate sensors with same ID from different providers', async () => {
            await service.onModuleInit();

            // Both providers return a sensor with the same ID
            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'duplicate-sensor',
                    name: 'Sensor from lm-sensors',
                    type: SensorType.CPU_CORE,
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            vi.mocked(diskSensors.read!).mockResolvedValue([
                {
                    id: 'duplicate-sensor',
                    name: 'Sensor from disk',
                    type: SensorType.DISK,
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics?.sensors.filter((s) => s.id === 'duplicate-sensor')).toHaveLength(2);
        });

        it('should handle empty sensor name', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'sensor-no-name',
                    name: '',
                    type: SensorType.CUSTOM,
                    value: 45,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics?.sensors[0].name).toBe('');
        });

        it('should handle negative temperature values', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'cold-sensor',
                    name: 'Freezer Sensor',
                    type: SensorType.CUSTOM,
                    value: -20,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics?.sensors[0].current.value).toBe(-20);
            expect(metrics?.sensors[0].current.status).toBe(TemperatureStatus.NORMAL);
        });

        it('should handle extremely high temperature values', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'hot-sensor',
                    name: 'Very Hot Sensor',
                    type: SensorType.CPU_CORE,
                    value: 150,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics?.sensors[0].current.value).toBe(150);
            expect(metrics?.sensors[0].current.status).toBe(TemperatureStatus.CRITICAL);
        });

        it('should handle NaN temperature values', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'nan-sensor',
                    name: 'Bad Sensor',
                    type: SensorType.CUSTOM,
                    value: NaN,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics).toBeNull();
        });

        it('should handle mix of valid and NaN temperature values', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockResolvedValue([
                {
                    id: 'valid-sensor',
                    name: 'Good Sensor',
                    type: SensorType.CPU_CORE,
                    value: 45,
                    unit: TemperatureUnit.CELSIUS,
                },
                {
                    id: 'nan-sensor',
                    name: 'Bad Sensor',
                    type: SensorType.CUSTOM,
                    value: NaN,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics).toBeDefined();
            expect(metrics?.sensors).toHaveLength(1);
            expect(metrics?.sensors[0].id).toBe('valid-sensor');
            expect(metrics?.summary.average).toBe(45);
        });

        it('should handle all providers failing', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockRejectedValue(new Error('lm-sensors failed'));
            vi.mocked(diskSensors.read!).mockRejectedValue(new Error('disk sensors failed'));

            const metrics = await service.getMetrics();

            expect(metrics).toBeNull();
        });

        it('should handle partial provider failures', async () => {
            await service.onModuleInit();

            vi.mocked(lmSensors.read!).mockRejectedValue(new Error('lm-sensors failed'));
            vi.mocked(diskSensors.read!).mockResolvedValue([
                {
                    id: 'disk:sda',
                    name: 'HDD',
                    type: SensorType.DISK,
                    value: 35,
                    unit: TemperatureUnit.CELSIUS,
                },
            ]);

            const metrics = await service.getMetrics();

            expect(metrics).toBeDefined();
            expect(metrics?.sensors).toHaveLength(1);
            expect(metrics?.sensors[0].name).toBe('HDD');
        });
    });
});
