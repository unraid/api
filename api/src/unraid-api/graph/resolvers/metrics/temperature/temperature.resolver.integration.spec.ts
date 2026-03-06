import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureMetrics,
    TemperatureStatus,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionManagerService } from '@app/unraid-api/graph/services/subscription-manager.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

// ...

describe('Temperature GraphQL Integration', () => {
    let module: TestingModule;
    let resolver: MetricsResolver;
    let temperatureService: TemperatureService;

    const mockTemperatureMetrics = {
        id: 'temperature-metrics',
        sensors: [
            {
                id: 'cpu:package',
                name: 'CPU Package',
                type: SensorType.CPU_PACKAGE,
                current: {
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                min: {
                    value: 45,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
                max: {
                    value: 65,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.WARNING,
                },
                warning: 70,
                critical: 85,
            },
        ],
        summary: {
            average: 55,
            hottest: {
                id: 'cpu:package',
                name: 'CPU Package',
                type: SensorType.CPU_PACKAGE,
                current: {
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
            },
            coolest: {
                id: 'cpu:package',
                name: 'CPU Package',
                type: SensorType.CPU_PACKAGE,
                current: {
                    value: 55,
                    unit: TemperatureUnit.CELSIUS,
                    timestamp: new Date(),
                    status: TemperatureStatus.NORMAL,
                },
            },
            warningCount: 0,
            criticalCount: 0,
        },
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                MetricsResolver,
                {
                    provide: CpuService,
                    useValue: {
                        getUtilization: vi.fn().mockResolvedValue({}),
                    },
                },
                {
                    provide: CpuTopologyService,
                    useValue: {
                        generateTopology: vi.fn().mockResolvedValue([]),
                        generateTelemetry: vi.fn().mockResolvedValue([]),
                    },
                },
                {
                    provide: MemoryService,
                    useValue: {
                        getUtilization: vi.fn().mockResolvedValue({}),
                    },
                },
                {
                    provide: TemperatureService,
                    useValue: {
                        getMetrics: vi.fn().mockResolvedValue(mockTemperatureMetrics),
                    },
                },
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        registerTopic: vi.fn(),
                        cleanup: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionHelperService,
                    useValue: {
                        createTrackedSubscription: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionManagerService,
                    useValue: {
                        stopAll: vi.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn((key: string, defaultValue?: unknown) => defaultValue),
                    },
                },
                {
                    provide: TemperatureConfigService,
                    useValue: {
                        getConfig: vi.fn().mockReturnValue({ enabled: true, polling_interval: 5000 }),
                    },
                },
            ],
        }).compile();

        resolver = module.get<MetricsResolver>(MetricsResolver);
        temperatureService = module.get<TemperatureService>(TemperatureService);
    });

    afterEach(async () => {
        await module.close();
    });

    describe('temperature field resolver', () => {
        it('should return temperature data via resolver', async () => {
            const result = await resolver.temperature();

            expect(result).toBeDefined();
            expect(result?.sensors).toHaveLength(1);
            expect(result?.sensors[0].name).toBe('CPU Package');
            expect(result?.sensors[0].type).toBe(SensorType.CPU_PACKAGE);
            expect(result?.sensors[0].current.value).toBe(55);
            expect(result?.summary.average).toBe(55);
        });

        it('should handle null temperature metrics gracefully', async () => {
            vi.mocked(temperatureService.getMetrics).mockResolvedValue(null);

            const result = await resolver.temperature();

            expect(result).toBeNull();
        });

        it('should return summary with correct counts', async () => {
            const metricsWithWarnings = {
                ...mockTemperatureMetrics,
                summary: {
                    ...mockTemperatureMetrics.summary,
                    warningCount: 2,
                    criticalCount: 1,
                },
            };

            vi.mocked(temperatureService.getMetrics).mockResolvedValue(metricsWithWarnings);

            const result = await resolver.temperature();

            expect(result?.summary.warningCount).toBe(2);
            expect(result?.summary.criticalCount).toBe(1);
        });

        it('should handle multiple sensors', async () => {
            const multiSensorMetrics = {
                id: 'temperature-metrics',
                sensors: [
                    mockTemperatureMetrics.sensors[0],
                    {
                        id: 'disk:sda',
                        name: 'Disk /dev/sda',
                        type: SensorType.DISK,
                        current: {
                            value: 35,
                            unit: TemperatureUnit.CELSIUS,
                            timestamp: new Date(),
                            status: TemperatureStatus.NORMAL,
                        },
                    },
                ],
                summary: mockTemperatureMetrics.summary,
            };

            vi.mocked(temperatureService.getMetrics).mockResolvedValue(
                multiSensorMetrics as unknown as TemperatureMetrics
            );

            const result = await resolver.temperature();

            expect(result?.sensors).toHaveLength(2);
            expect(result?.sensors[0].type).toBe(SensorType.CPU_PACKAGE);
            expect(result?.sensors[1].type).toBe(SensorType.DISK);
        });
    });

    describe('error handling', () => {
        it('should handle service errors gracefully', async () => {
            vi.mocked(temperatureService.getMetrics).mockRejectedValue(
                new Error('Failed to read sensors')
            );

            await expect(resolver.temperature()).rejects.toThrow('Failed to read sensors');
        });
    });
});
