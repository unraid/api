import type { TestingModule } from '@nestjs/testing';
import { ScheduleModule } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionManagerService } from '@app/unraid-api/graph/services/subscription-manager.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('MetricsResolver Integration Tests', () => {
    let metricsResolver: MetricsResolver;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [ScheduleModule.forRoot()],
            providers: [
                MetricsResolver,
                CpuService,
                CpuTopologyService,
                MemoryService,
                SubscriptionTrackerService,
                SubscriptionHelperService,
                SubscriptionManagerService,
            ],
        }).compile();

        metricsResolver = module.get<MetricsResolver>(MetricsResolver);
        // Initialize the module to register polling topics
        metricsResolver.onModuleInit();
    });

    afterEach(async () => {
        // Clean up polling service
        const subscriptionManager = module.get<SubscriptionManagerService>(SubscriptionManagerService);
        subscriptionManager.stopAll();
        await module.close();
    });

    describe('Metrics Query', () => {
        it('should return metrics root object', async () => {
            const result = await metricsResolver.metrics();
            expect(result).toEqual({
                id: 'metrics',
            });
        });

        it('should return CPU utilization metrics', async () => {
            const result = await metricsResolver.cpu();

            expect(result).toHaveProperty('id', 'info/cpu-load');
            expect(result).toHaveProperty('percentTotal');
            expect(result).toHaveProperty('cpus');
            expect(result.cpus).toBeInstanceOf(Array);
            if (Number.isFinite(result.percentTotal)) {
                expect(result.percentTotal).toBeGreaterThanOrEqual(0);
                expect(result.percentTotal).toBeLessThanOrEqual(100);
            } else {
                expect(Number.isNaN(result.percentTotal)).toBe(true);
            }

            if (result.cpus.length > 0) {
                const firstCpu = result.cpus[0];
                expect(firstCpu).toHaveProperty('percentTotal');
                expect(firstCpu).toHaveProperty('percentUser');
                expect(firstCpu).toHaveProperty('percentSystem');
                expect(firstCpu).toHaveProperty('percentIdle');
            }
        });

        it('should return memory utilization metrics', async () => {
            const result = await metricsResolver.memory();

            expect(result).toHaveProperty('id', 'memory-utilization');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('used');
            expect(result).toHaveProperty('free');
            expect(result).toHaveProperty('available');
            expect(result).toHaveProperty('percentTotal');
            expect(result).toHaveProperty('swapTotal');
            expect(result).toHaveProperty('swapUsed');
            expect(result).toHaveProperty('swapFree');
            expect(result).toHaveProperty('percentSwapTotal');

            expect(result.total).toBeGreaterThan(0);
            expect(result.percentTotal).toBeGreaterThanOrEqual(0);
            expect(result.percentTotal).toBeLessThanOrEqual(100);
        });
    });

    describe('Polling Mechanism', () => {
        it('should prevent concurrent CPU polling executions', async () => {
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const cpuService = module.get<CpuService>(CpuService);
            let executionCount = 0;

            vi.spyOn(cpuService, 'generateCpuLoad').mockImplementation(async () => {
                executionCount++;
                await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate slow operation
                return {
                    id: 'info/cpu-load',
                    percentTotal: 50,
                    cpus: [],
                };
            });

            // Trigger polling by simulating subscription
            trackerService.subscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);

            // Wait a bit for potential multiple executions
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should only execute once despite potential concurrent attempts
            expect(executionCount).toBeLessThanOrEqual(2); // Allow for initial execution
        });

        it('should prevent concurrent memory polling executions', async () => {
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const memoryService = module.get<MemoryService>(MemoryService);
            let executionCount = 0;

            vi.spyOn(memoryService, 'generateMemoryLoad').mockImplementation(async () => {
                executionCount++;
                await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate slow operation
                return {
                    id: 'memory-utilization',
                    total: 16000000000,
                    used: 8000000000,
                    free: 8000000000,
                    available: 8000000000,
                    active: 4000000000,
                    buffcache: 2000000000,
                    percentTotal: 50,
                    swapTotal: 0,
                    swapUsed: 0,
                    swapFree: 0,
                    percentSwapTotal: 0,
                } as any;
            });

            // Trigger polling by simulating subscription
            trackerService.subscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);

            // Wait a bit for potential multiple executions
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should only execute once despite potential concurrent attempts
            expect(executionCount).toBeLessThanOrEqual(2); // Allow for initial execution
        });

        it('should publish CPU metrics to pubsub', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);

            // Trigger polling by starting subscription
            trackerService.subscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);

            // Wait for the polling interval to trigger (1000ms for CPU)
            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(publishSpy).toHaveBeenCalledWith(
                PUBSUB_CHANNEL.CPU_UTILIZATION,
                expect.objectContaining({
                    systemMetricsCpu: expect.objectContaining({
                        id: 'info/cpu-load',
                        percentTotal: expect.any(Number),
                        cpus: expect.any(Array),
                    }),
                })
            );

            trackerService.unsubscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);
            publishSpy.mockRestore();
        });

        it('should publish memory metrics to pubsub', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const memoryService = module.get<MemoryService>(MemoryService);

            vi.spyOn(memoryService, 'generateMemoryLoad').mockResolvedValue({
                id: 'memory-utilization',
                total: 16000000000,
                used: 8000000000,
                free: 8000000000,
                available: 7000000000,
                active: 4000000000,
                buffcache: 3000000000,
                percentTotal: 50,
                swapTotal: 1000000000,
                swapUsed: 100000000,
                swapFree: 900000000,
                percentSwapTotal: 10,
            } as any);

            // Trigger polling by starting subscription
            trackerService.subscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);

            // Wait for the polling interval to trigger (2000ms for memory)
            await new Promise((resolve) => setTimeout(resolve, 2300));

            expect(publishSpy).toHaveBeenCalledWith(
                PUBSUB_CHANNEL.MEMORY_UTILIZATION,
                expect.objectContaining({
                    systemMetricsMemory: expect.objectContaining({
                        id: 'memory-utilization',
                        used: expect.any(Number),
                        free: expect.any(Number),
                        percentTotal: expect.any(Number),
                    }),
                })
            );

            trackerService.unsubscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);
            publishSpy.mockRestore();
        });

        it('should handle errors in CPU polling gracefully', async () => {
            const service = module.get<CpuService>(CpuService);
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const subscriptionManager =
                module.get<SubscriptionManagerService>(SubscriptionManagerService);

            // Mock logger to capture error logs
            const loggerSpy = vi
                .spyOn(subscriptionManager['logger'], 'error')
                .mockImplementation(() => {});
            vi.spyOn(service, 'generateCpuLoad').mockRejectedValueOnce(new Error('CPU error'));

            // Trigger polling
            trackerService.subscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);

            // Wait for polling interval to trigger and handle error (1000ms for CPU)
            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in subscription callback'),
                expect.any(Error)
            );

            trackerService.unsubscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);
            loggerSpy.mockRestore();
        });

        it('should handle errors in memory polling gracefully', async () => {
            const service = module.get<MemoryService>(MemoryService);
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const subscriptionManager =
                module.get<SubscriptionManagerService>(SubscriptionManagerService);

            // Mock logger to capture error logs
            const loggerSpy = vi
                .spyOn(subscriptionManager['logger'], 'error')
                .mockImplementation(() => {});
            vi.spyOn(service, 'generateMemoryLoad').mockRejectedValueOnce(new Error('Memory error'));

            // Trigger polling
            trackerService.subscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);

            // Wait for polling interval to trigger and handle error (2000ms for memory)
            await new Promise((resolve) => setTimeout(resolve, 2100));

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in subscription callback'),
                expect.any(Error)
            );

            trackerService.unsubscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);
            loggerSpy.mockRestore();
        });
    });

    describe('Polling cleanup on module destroy', () => {
        it('should clean up timers when module is destroyed', async () => {
            const trackerService = module.get<SubscriptionTrackerService>(SubscriptionTrackerService);
            const subscriptionManager =
                module.get<SubscriptionManagerService>(SubscriptionManagerService);

            // Start polling
            trackerService.subscribe(PUBSUB_CHANNEL.CPU_UTILIZATION);
            trackerService.subscribe(PUBSUB_CHANNEL.MEMORY_UTILIZATION);

            // Wait a bit for subscriptions to be fully set up
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verify subscriptions are active
            expect(subscriptionManager.isSubscriptionActive(PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(true);
            expect(subscriptionManager.isSubscriptionActive(PUBSUB_CHANNEL.MEMORY_UTILIZATION)).toBe(
                true
            );

            // Clean up the module
            await module.close();

            // Subscriptions should be cleaned up
            expect(subscriptionManager.isSubscriptionActive(PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(false);
            expect(subscriptionManager.isSubscriptionActive(PUBSUB_CHANNEL.MEMORY_UTILIZATION)).toBe(
                false
            );
        });
    });
});
