import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CpuDataService, CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('MetricsResolver Integration Tests', () => {
    let metricsResolver: MetricsResolver;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                MetricsResolver,
                CpuService,
                CpuDataService,
                MemoryService,
                SubscriptionTrackerService,
                SubscriptionHelperService,
            ],
        }).compile();

        metricsResolver = module.get<MetricsResolver>(MetricsResolver);
    });

    afterEach(async () => {
        // Clean up any active timers
        if (metricsResolver['cpuPollingTimer']) {
            clearInterval(metricsResolver['cpuPollingTimer']);
        }
        if (metricsResolver['memoryPollingTimer']) {
            clearInterval(metricsResolver['memoryPollingTimer']);
        }
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
            expect(result).toHaveProperty('load');
            expect(result).toHaveProperty('cpus');
            expect(result.cpus).toBeInstanceOf(Array);
            expect(result.load).toBeGreaterThanOrEqual(0);
            expect(result.load).toBeLessThanOrEqual(100);

            if (result.cpus.length > 0) {
                const firstCpu = result.cpus[0];
                expect(firstCpu).toHaveProperty('load');
                expect(firstCpu).toHaveProperty('loadUser');
                expect(firstCpu).toHaveProperty('loadSystem');
                expect(firstCpu).toHaveProperty('loadIdle');
            }
        });

        it('should return memory utilization metrics', async () => {
            const result = await metricsResolver.memory();

            expect(result).toHaveProperty('id', 'memory-utilization');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('used');
            expect(result).toHaveProperty('free');
            expect(result).toHaveProperty('available');
            expect(result).toHaveProperty('usedPercent');
            expect(result).toHaveProperty('swapTotal');
            expect(result).toHaveProperty('swapUsed');
            expect(result).toHaveProperty('swapFree');
            expect(result).toHaveProperty('swapUsedPercent');

            expect(result.total).toBeGreaterThan(0);
            expect(result.usedPercent).toBeGreaterThanOrEqual(0);
            expect(result.usedPercent).toBeLessThanOrEqual(100);
        });
    });

    describe('Polling Mechanism', () => {
        it('should prevent concurrent CPU polling executions', async () => {
            // Start multiple polling attempts simultaneously
            const promises = Array(5)
                .fill(null)
                .map(() => metricsResolver['pollCpuUtilization']());

            await Promise.all(promises);

            // Only one execution should have occurred
            expect(metricsResolver['isCpuPollingInProgress']).toBe(false);
        });

        it('should prevent concurrent memory polling executions', async () => {
            // Start multiple polling attempts simultaneously
            const promises = Array(5)
                .fill(null)
                .map(() => metricsResolver['pollMemoryUtilization']());

            await Promise.all(promises);

            // Only one execution should have occurred
            expect(metricsResolver['isMemoryPollingInProgress']).toBe(false);
        });

        it('should publish CPU metrics to pubsub', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');

            await metricsResolver['pollCpuUtilization']();

            expect(publishSpy).toHaveBeenCalledWith(
                PUBSUB_CHANNEL.CPU_UTILIZATION,
                expect.objectContaining({
                    systemMetricsCpu: expect.objectContaining({
                        id: 'info/cpu-load',
                        load: expect.any(Number),
                        cpus: expect.any(Array),
                    }),
                })
            );

            publishSpy.mockRestore();
        });

        it('should publish memory metrics to pubsub', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');

            await metricsResolver['pollMemoryUtilization']();

            expect(publishSpy).toHaveBeenCalledWith(
                PUBSUB_CHANNEL.MEMORY_UTILIZATION,
                expect.objectContaining({
                    systemMetricsMemory: expect.objectContaining({
                        id: 'memory-utilization',
                        used: expect.any(Number),
                        free: expect.any(Number),
                        usedPercent: expect.any(Number),
                    }),
                })
            );

            publishSpy.mockRestore();
        });

        it('should handle errors in CPU polling gracefully', async () => {
            const service = module.get<CpuService>(CpuService);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(service, 'generateCpuLoad').mockRejectedValueOnce(new Error('CPU error'));

            await metricsResolver['pollCpuUtilization']();

            expect(errorSpy).toHaveBeenCalledWith('Error polling CPU utilization:', expect.any(Error));
            expect(metricsResolver['isCpuPollingInProgress']).toBe(false);

            errorSpy.mockRestore();
        });

        it('should handle errors in memory polling gracefully', async () => {
            const service = module.get<MemoryService>(MemoryService);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(service, 'generateMemoryLoad').mockRejectedValueOnce(new Error('Memory error'));

            await metricsResolver['pollMemoryUtilization']();

            expect(errorSpy).toHaveBeenCalledWith(
                'Error polling memory utilization:',
                expect.any(Error)
            );
            expect(metricsResolver['isMemoryPollingInProgress']).toBe(false);

            errorSpy.mockRestore();
        });
    });

    describe('Polling cleanup on module destroy', () => {
        it('should clean up timers when module is destroyed', async () => {
            // Force-start polling
            await metricsResolver['pollCpuUtilization']();
            expect(metricsResolver['isCpuPollingInProgress']).toBe(false);

            await metricsResolver['pollMemoryUtilization']();
            expect(metricsResolver['isMemoryPollingInProgress']).toBe(false);

            // Clean up the module
            await module.close();

            // Timers should be cleaned up
            expect(metricsResolver['cpuPollingTimer']).toBeUndefined();
            expect(metricsResolver['memoryPollingTimer']).toBeUndefined();
        });
    });
});
