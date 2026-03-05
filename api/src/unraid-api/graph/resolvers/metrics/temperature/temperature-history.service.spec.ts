import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemperatureHistoryService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature_history.service.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureStatus,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

describe('TemperatureHistoryService', () => {
    let service: TemperatureHistoryService;
    let configService: TemperatureConfigService;

    beforeEach(() => {
        configService = {
            getConfig: vi.fn().mockReturnValue({
                history: {
                    max_readings: 1000,
                    retention_ms: 86400000,
                },
            }),
        } as unknown as TemperatureConfigService;

        service = new TemperatureHistoryService(configService);
    });

    describe('record and retrieval', () => {
        it('should record a reading and retrieve it', () => {
            const reading = {
                value: 45.5,
                unit: TemperatureUnit.CELSIUS,
                timestamp: new Date(),
                status: TemperatureStatus.NORMAL,
            };

            service.record('sensor1', reading, {
                name: 'CPU Package',
                type: SensorType.CPU_PACKAGE,
            });

            const history = service.getHistory('sensor1');
            expect(history).toHaveLength(1);
            expect(history[0].value).toBe(45.5);
        });

        it('should return empty array for unknown sensor', () => {
            const history = service.getHistory('unknown');
            expect(history).toEqual([]);
        });
    });

    describe('min/max tracking', () => {
        it('should track minimum temperature', () => {
            const metadata = { name: 'CPU', type: SensorType.CPU_CORE };

            service.record(
                'sensor1',
                {
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            service.record(
                'sensor1',
                {
                    value: 45,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            service.record(
                'sensor1',
                {
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            const { min, max } = service.getMinMax('sensor1');
            expect(min?.value).toBe(45);
            expect(max?.value).toBe(55);
        });

        it('should return empty object for unknown sensor', () => {
            const result = service.getMinMax('unknown');
            expect(result).toEqual({});
        });
    });

    describe('retention and trimming', () => {
        it('should keep only max readings per sensor', () => {
            const configServiceWithLimit = {
                getConfig: vi.fn().mockReturnValue({
                    history: {
                        max_readings: 3,
                        retention_ms: 86400000,
                    },
                }),
            } as unknown as TemperatureConfigService;

            const limitedService = new TemperatureHistoryService(configServiceWithLimit);
            const metadata = { name: 'CPU', type: SensorType.CPU_CORE };

            // Add 5 readings
            for (let i = 0; i < 5; i++) {
                limitedService.record(
                    'sensor1',
                    {
                        value: 40 + i,
                        unit: TemperatureUnit.CELSIUS,
                        timestamp: new Date(Date.now() + i * 1000),
                        status: TemperatureStatus.NORMAL,
                    },
                    metadata
                );
            }

            const history = limitedService.getHistory('sensor1');
            expect(history).toHaveLength(3);
            // Should keep the most recent 3
            expect(history[0].value).toBe(42);
            expect(history[2].value).toBe(44);
        });
    });

    describe('metadata', () => {
        it('should store and retrieve sensor metadata', () => {
            service.record(
                'sensor1',
                {
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                {
                    name: 'CPU Package',
                    type: SensorType.CPU_PACKAGE,
                }
            );

            const metadata = service.getMetadata('sensor1');
            expect(metadata?.name).toBe('CPU Package');
            expect(metadata?.type).toBe(SensorType.CPU_PACKAGE);
        });

        it('should return null for unknown sensor', () => {
            const metadata = service.getMetadata('unknown');
            expect(metadata).toBeNull();
        });
    });

    describe('getMostRecentReading', () => {
        it('should return the newest reading across all sensors', () => {
            const metadata = { name: 'Sensor', type: SensorType.CUSTOM };
            const now = Date.now();

            service.record(
                'sensor1',
                {
                    value: 40,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(now - 1000),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            service.record(
                'sensor2',
                {
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(now),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            const newest = service.getMostRecentReading();
            expect(newest?.value).toBe(50);
        });

        it('should return null when no readings exist', () => {
            const newest = service.getMostRecentReading();
            expect(newest).toBeNull();
        });
    });

    describe('stats', () => {
        it('should return correct statistics', () => {
            const metadata = { name: 'Sensor', type: SensorType.CUSTOM };

            service.record(
                'sensor1',
                {
                    value: 40,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            service.record(
                'sensor1',
                {
                    value: 45,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            service.record(
                'sensor2',
                {
                    value: 50,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                metadata
            );

            const stats = service.getStats();
            expect(stats.totalSensors).toBe(2);
            expect(stats.totalReadings).toBe(3);
        });
    });
});
