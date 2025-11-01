import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('MetricsResolver', () => {
    let resolver: MetricsResolver;
    let cpuService: CpuService;
    let memoryService: MemoryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsResolver,
                CpuTopologyService,
                {
                    provide: CpuService,
                    useValue: {
                        generateCpuLoad: vi.fn().mockResolvedValue({
                            id: 'info/cpu-load',
                            load: 25.5,
                            cpus: [
                                {
                                    load: 30.0,
                                    loadUser: 20.0,
                                    loadSystem: 10.0,
                                    loadNice: 0,
                                    loadIdle: 70.0,
                                    loadIrq: 0,
                                    loadGuest: 0,
                                    loadSteal: 0,
                                },
                                {
                                    load: 21.0,
                                    loadUser: 15.0,
                                    loadSystem: 6.0,
                                    loadNice: 0,
                                    loadIdle: 79.0,
                                    loadIrq: 0,
                                    loadGuest: 0,
                                    loadSteal: 0,
                                },
                            ],
                        }),
                    },
                },
                {
                    provide: MemoryService,
                    useValue: {
                        generateMemoryLoad: vi.fn().mockResolvedValue({
                            id: 'memory-utilization',
                            total: 16777216000,
                            used: 8388608000,
                            free: 8388608000,
                            available: 10000000000,
                            active: 5000000000,
                            buffcache: 2000000000,
                            usedPercent: 50.0,
                            swapTotal: 4294967296,
                            swapUsed: 0,
                            swapFree: 4294967296,
                            swapUsedPercent: 0,
                        }),
                    },
                },
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        registerTopic: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionHelperService,
                    useValue: {
                        createTrackedSubscription: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<MetricsResolver>(MetricsResolver);
        cpuService = module.get<CpuService>(CpuService);
        memoryService = module.get<MemoryService>(MemoryService);
    });

    describe('metrics', () => {
        it('should return basic metrics object', async () => {
            const result = await resolver.metrics();
            expect(result).toEqual({
                id: 'metrics',
            });
        });
    });

    describe('cpu', () => {
        it('should return CPU utilization data', async () => {
            const result = await resolver.cpu();

            expect(cpuService.generateCpuLoad).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/cpu-load',
                load: 25.5,
                cpus: expect.arrayContaining([
                    expect.objectContaining({
                        load: 30.0,
                        loadUser: 20.0,
                        loadSystem: 10.0,
                    }),
                    expect.objectContaining({
                        load: 21.0,
                        loadUser: 15.0,
                        loadSystem: 6.0,
                    }),
                ]),
            });
        });

        it('should handle CPU service errors gracefully', async () => {
            vi.mocked(cpuService.generateCpuLoad).mockRejectedValueOnce(new Error('CPU error'));

            await expect(resolver.cpu()).rejects.toThrow('CPU error');
        });
    });

    describe('memory', () => {
        it('should return memory utilization data', async () => {
            const result = await resolver.memory();

            expect(memoryService.generateMemoryLoad).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'memory-utilization',
                total: 16777216000,
                used: 8388608000,
                free: 8388608000,
                available: 10000000000,
                active: 5000000000,
                buffcache: 2000000000,
                usedPercent: 50.0,
                swapTotal: 4294967296,
                swapUsed: 0,
                swapFree: 4294967296,
                swapUsedPercent: 0,
            });
        });

        it('should handle memory service errors gracefully', async () => {
            vi.mocked(memoryService.generateMemoryLoad).mockRejectedValueOnce(new Error('Memory error'));

            await expect(resolver.memory()).rejects.toThrow('Memory error');
        });
    });

    describe('onModuleInit', () => {
        it('should register CPU and memory polling topics', () => {
            const subscriptionTracker = {
                registerTopic: vi.fn(),
            };

            const testModule = new MetricsResolver(
                cpuService,
                {} as any,
                memoryService,
                subscriptionTracker as any,
                {} as any
            );

            testModule.onModuleInit();

            expect(subscriptionTracker.registerTopic).toHaveBeenCalledTimes(3);
            expect(subscriptionTracker.registerTopic).toHaveBeenCalledWith(
                'CPU_UTILIZATION',
                expect.any(Function),
                1000
            );
            expect(subscriptionTracker.registerTopic).toHaveBeenCalledWith(
                'MEMORY_UTILIZATION',
                expect.any(Function),
                2000
            );
        });
    });
});
