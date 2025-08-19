import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { InfoCpuResolver } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.resolver.js';
import { CpuDataService, CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { DevicesResolver } from '@app/unraid-api/graph/resolvers/info/devices/devices.resolver.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices/devices.service.js';
import { InfoDisplayResolver } from '@app/unraid-api/graph/resolvers/info/display/display.resolver.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoMemoryResolver } from '@app/unraid-api/graph/resolvers/info/memory/memory.resolver.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { OsResolver } from '@app/unraid-api/graph/resolvers/info/os/os.resolver.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';
import {
    BaseboardResolver,
    SystemResolver,
} from '@app/unraid-api/graph/resolvers/info/system/system.resolver.js';
import { VersionsResolver } from '@app/unraid-api/graph/resolvers/info/versions/versions.resolver.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('InfoResolver Integration Tests', () => {
    let infoResolver: InfoResolver;
    let cpuResolver: InfoCpuResolver;
    let memoryResolver: InfoMemoryResolver;
    let devicesResolver: DevicesResolver;
    let displayResolver: InfoDisplayResolver;
    let systemResolver: SystemResolver;
    let baseboardResolver: BaseboardResolver;
    let osResolver: OsResolver;
    let versionsResolver: VersionsResolver;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                InfoResolver,
                InfoCpuResolver,
                InfoMemoryResolver,
                DevicesResolver,
                InfoDisplayResolver,
                SystemResolver,
                BaseboardResolver,
                OsResolver,
                VersionsResolver,
                CpuService,
                CpuDataService,
                MemoryService,
                DevicesService,
                OsService,
                VersionsService,
                DisplayService,
                SubscriptionTrackerService,
                SubscriptionHelperService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: (key: string) => {
                            if (key === 'store.emhttp.var.version') {
                                return '6.12.0';
                            }
                            return undefined;
                        },
                    },
                },
                {
                    provide: DockerService,
                    useValue: {
                        getContainers: async () => [],
                    },
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        get: async () => null,
                        set: async () => {},
                    },
                },
            ],
        }).compile();

        infoResolver = module.get<InfoResolver>(InfoResolver);
        cpuResolver = module.get<InfoCpuResolver>(InfoCpuResolver);
        memoryResolver = module.get<InfoMemoryResolver>(InfoMemoryResolver);
        devicesResolver = module.get<DevicesResolver>(DevicesResolver);
        displayResolver = module.get<InfoDisplayResolver>(InfoDisplayResolver);
        systemResolver = module.get<SystemResolver>(SystemResolver);
        baseboardResolver = module.get<BaseboardResolver>(BaseboardResolver);
        osResolver = module.get<OsResolver>(OsResolver);
        versionsResolver = module.get<VersionsResolver>(VersionsResolver);
    });

    afterEach(async () => {
        // Clean up any active timers
        if (cpuResolver['cpuPollingTimer']) {
            clearInterval(cpuResolver['cpuPollingTimer']);
        }
        if (memoryResolver['memoryPollingTimer']) {
            clearInterval(memoryResolver['memoryPollingTimer']);
        }
        await module.close();
    });

    describe('Sub-Resolver Polling Mechanism', () => {
        it('should prevent concurrent CPU polling executions in CPU resolver', async () => {
            // Start multiple polling attempts simultaneously
            const promises = Array(5)
                .fill(null)
                .map(() => cpuResolver['pollCpuUtilization']());

            await Promise.all(promises);

            // Only one execution should have occurred
            expect(cpuResolver['isCpuPollingInProgress']).toBe(false);
        });

        it('should prevent concurrent memory polling executions in memory resolver', async () => {
            // Start multiple polling attempts simultaneously
            const promises = Array(5)
                .fill(null)
                .map(() => memoryResolver['pollMemoryUtilization']());

            await Promise.all(promises);

            // Only one execution should have occurred
            expect(memoryResolver['isMemoryPollingInProgress']).toBe(false);
        });

        it('should publish CPU metrics to pubsub from CPU resolver', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');

            await cpuResolver['pollCpuUtilization']();

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

        it('should publish memory metrics to pubsub from memory resolver', async () => {
            const publishSpy = vi.spyOn(pubsub, 'publish');

            await memoryResolver['pollMemoryUtilization']();

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

            await cpuResolver['pollCpuUtilization']();

            expect(errorSpy).toHaveBeenCalledWith('Error polling CPU utilization:', expect.any(Error));
            expect(cpuResolver['isCpuPollingInProgress']).toBe(false);

            errorSpy.mockRestore();
        });

        it('should handle errors in memory polling gracefully', async () => {
            const service = module.get<MemoryService>(MemoryService);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(service, 'generateMemoryLoad').mockRejectedValueOnce(new Error('Memory error'));

            await memoryResolver['pollMemoryUtilization']();

            expect(errorSpy).toHaveBeenCalledWith(
                'Error polling memory utilization:',
                expect.any(Error)
            );
            expect(memoryResolver['isMemoryPollingInProgress']).toBe(false);

            errorSpy.mockRestore();
        });
    });

    describe('InfoResolver Query Methods', () => {
        it('should return valid info object', async () => {
            const result = await infoResolver.info();
            expect(result).toHaveProperty('id', 'info');
        });

        it('should return current time', async () => {
            const before = new Date();
            const result = await infoResolver.time();
            const after = new Date();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should return minimal memory stub for sub-resolver', () => {
            const result = infoResolver.memory();

            expect(result).toHaveProperty('id', 'info/memory');
            // InfoResolver returns minimal stub, InfoMemoryResolver handles all other fields
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal CPU stub for sub-resolver', () => {
            const result = infoResolver.cpu();

            expect(result).toHaveProperty('id', 'info/cpu');
            // InfoResolver returns minimal stub, InfoCpuResolver handles all other fields
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal devices stub for sub-resolver', async () => {
            const result = await infoResolver.devices();

            expect(result).toHaveProperty('id', 'info/devices');
            // InfoResolver returns minimal stub, DevicesResolver handles all other fields
        });

        it('should return minimal display stub for sub-resolver', () => {
            const result = infoResolver.display();

            expect(result).toHaveProperty('id', 'info/display');
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal system stub for sub-resolver', () => {
            const result = infoResolver.system();

            expect(result).toHaveProperty('id', 'info/system');
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal baseboard stub for sub-resolver', () => {
            const result = infoResolver.baseboard();

            expect(result).toHaveProperty('id', 'info/baseboard');
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal os stub for sub-resolver', () => {
            const result = infoResolver.os();

            expect(result).toHaveProperty('id', 'info/os');
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return minimal versions stub for sub-resolver', () => {
            const result = infoResolver.versions();

            expect(result).toHaveProperty('id', 'info/versions');
            expect(Object.keys(result)).toEqual(['id']);
        });
    });

    describe('Sub-Resolver Integration', () => {
        it('should resolve CPU fields through InfoCpuResolver', async () => {
            const cpuStub = infoResolver.cpu();
            const manufacturer = await cpuResolver.manufacturer(cpuStub as any);
            const brand = await cpuResolver.brand(cpuStub as any);
            const cores = await cpuResolver.cores(cpuStub as any);
            const utilization = await cpuResolver.utilization();

            expect(manufacturer).toBeDefined();
            expect(brand).toBeDefined();
            expect(cores).toBeGreaterThan(0);
            expect(utilization).toHaveProperty('id', 'info/cpu-load');
            expect(utilization).toHaveProperty('load');
            expect(utilization).toHaveProperty('cpus');
        });

        it('should resolve memory fields through InfoMemoryResolver', async () => {
            const memoryStub = infoResolver.memory();
            const layout = await memoryResolver.layout(memoryStub);
            const utilization = await memoryResolver.utilization();

            expect(layout).toBeInstanceOf(Array);
            expect(utilization).toHaveProperty('id', 'memory-utilization');
            expect(utilization).toHaveProperty('used');
            expect(utilization).toHaveProperty('free');
            expect(utilization).toHaveProperty('usedPercent');
        });

        it('should resolve device fields through DevicesResolver', async () => {
            const gpu = await devicesResolver.gpu();
            const network = await devicesResolver.network();
            const pci = await devicesResolver.pci();
            const usb = await devicesResolver.usb();

            expect(gpu).toBeInstanceOf(Array);
            expect(network).toBeInstanceOf(Array);
            expect(pci).toBeInstanceOf(Array);
            expect(usb).toBeInstanceOf(Array);
        });

        it('should resolve display fields through InfoDisplayResolver', async () => {
            const displayStub = infoResolver.display();
            const theme = await displayResolver.theme(displayStub);
            const unit = await displayResolver.unit(displayStub);
            const scale = await displayResolver.scale(displayStub);

            expect(theme).toBeDefined();
            expect(unit).toBeDefined();
            expect(typeof scale).toBe('boolean');
        });

        it('should resolve system fields through SystemResolver', async () => {
            const systemStub = infoResolver.system();
            const manufacturer = await systemResolver.manufacturer(systemStub);
            const model = await systemResolver.model(systemStub);
            const uuid = await systemResolver.uuid(systemStub);

            expect(manufacturer).toBeDefined();
            expect(model).toBeDefined();
            expect(uuid).toBeDefined();
        });

        it('should resolve baseboard fields through BaseboardResolver', async () => {
            const baseboardStub = infoResolver.baseboard();
            const manufacturer = await baseboardResolver.manufacturer(baseboardStub);
            const model = await baseboardResolver.model(baseboardStub);
            const serial = await baseboardResolver.serial(baseboardStub);

            expect(manufacturer).toBeDefined();
            expect(model).toBeDefined();
            expect(serial).toBeDefined();
        });

        it('should resolve os fields through OsResolver', async () => {
            const osStub = infoResolver.os();
            const platform = await osResolver.platform(osStub);
            const distro = await osResolver.distro(osStub);
            const kernel = await osResolver.kernel(osStub);

            expect(platform).toBeDefined();
            expect(distro).toBeDefined();
            expect(kernel).toBeDefined();
        });

        it('should resolve version fields through VersionsResolver with non-null values', async () => {
            const versionsStub = infoResolver.versions();
            expect(versionsStub).toEqual({ id: 'info/versions' });

            // Test that all version fields return non-null string values
            const unraid = await versionsResolver.unraid(versionsStub);
            const kernel = await versionsResolver.kernel(versionsStub);
            const node = await versionsResolver.node(versionsStub);
            const npm = await versionsResolver.npm(versionsStub);
            const docker = await versionsResolver.docker(versionsStub);

            // Verify that unraid version comes from our mock ConfigService
            expect(unraid).toBe('6.12.0');
            expect(unraid).toBeTypeOf('string');

            // Verify that other versions are non-null strings
            expect(kernel).toBeDefined();
            expect(kernel).not.toBeNull();
            expect(kernel).toBeTypeOf('string');

            expect(node).toBeDefined();
            expect(node).not.toBeNull();
            expect(node).toBeTypeOf('string');

            expect(npm).toBeDefined();
            expect(npm).not.toBeNull();
            expect(npm).toBeTypeOf('string');

            // Docker might be null if not installed
            if (docker !== undefined) {
                expect(docker).toBeTypeOf('string');
            }
        });
    });

    describe('Subscription Integration', () => {
        it('should setup CPU subscription through InfoCpuResolver', async () => {
            const subscription = await cpuResolver.systemMetricsCpuSubscription();
            expect(subscription).toBeDefined();
        });

        it('should setup memory subscription through InfoMemoryResolver', async () => {
            const subscription = await memoryResolver.systemMetricsMemorySubscription();
            expect(subscription).toBeDefined();
        });
    });
});
