import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { DevicesResolver } from '@app/unraid-api/graph/resolvers/info/devices/devices.resolver.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices/devices.service.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('InfoResolver Integration Tests', () => {
    let infoResolver: InfoResolver;
    let devicesResolver: DevicesResolver;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                InfoResolver,
                DevicesResolver,
                CpuService,
                CpuTopologyService,
                MemoryService,
                DevicesService,
                OsService,
                VersionsService,
                DisplayService,
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        trackActiveSubscriptions: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionHelperService,
                    useValue: {},
                },
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
        devicesResolver = module.get<DevicesResolver>(DevicesResolver);
    });

    afterEach(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('InfoResolver ResolveFields', () => {
        it('should return basic info object', async () => {
            const result = await infoResolver.info();
            expect(result).toEqual({
                id: 'info',
            });
        });

        it('should return current time', async () => {
            const before = new Date();
            const result = await infoResolver.time();
            const after = new Date();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should return full cpu object from service', async () => {
            const result = await infoResolver.cpu();

            expect(result).toHaveProperty('id', 'info/cpu');
            expect(result).toHaveProperty('manufacturer');
            expect(result).toHaveProperty('brand');
        });

        it('should return full memory object from service', async () => {
            const result = await infoResolver.memory();

            expect(result).toHaveProperty('id', 'info/memory');
            expect(result).toHaveProperty('layout');
            expect(result.layout).toBeInstanceOf(Array);
        });

        it('should return minimal devices stub for sub-resolver', () => {
            const result = infoResolver.devices();

            expect(result).toHaveProperty('id', 'info/devices');
            expect(Object.keys(result)).toEqual(['id']);
        });

        it('should return full display object from service', async () => {
            const result = await infoResolver.display();

            expect(result).toHaveProperty('id', 'info/display');
            expect(result).toHaveProperty('theme');
            expect(result).toHaveProperty('unit');
        });

        it('should return baseboard data', async () => {
            const result = await infoResolver.baseboard();

            expect(result).toHaveProperty('id', 'info/baseboard');
            expect(result).toHaveProperty('manufacturer');
            expect(result).toHaveProperty('model');
            expect(result).toHaveProperty('version');
            // These are the actual properties from systeminformation
            expect(typeof result.manufacturer).toBe('string');
        });

        it('should return system data', async () => {
            const result = await infoResolver.system();

            expect(result).toHaveProperty('id', 'info/system');
            expect(result).toHaveProperty('manufacturer');
            expect(result).toHaveProperty('model');
            expect(result).toHaveProperty('version');
            expect(result).toHaveProperty('serial');
            expect(result).toHaveProperty('uuid');
            // Verify types
            expect(typeof result.manufacturer).toBe('string');
        });

        it('should return os data from service', async () => {
            const result = await infoResolver.os();

            expect(result).toHaveProperty('id', 'info/os');
            expect(result).toHaveProperty('platform');
            expect(result).toHaveProperty('distro');
            expect(result).toHaveProperty('release');
            expect(result).toHaveProperty('kernel');
            // Verify platform is a string (could be linux, darwin, win32, etc)
            expect(typeof result.platform).toBe('string');
        });

        it('should return versions stub for field resolvers', () => {
            const result = infoResolver.versions();

            expect(result).toHaveProperty('id', 'info/versions');
            // Versions now returns a stub object, with actual data resolved via field resolvers
            expect(Object.keys(result)).toEqual(['id']);
        });
    });

    describe('Sub-Resolver Integration', () => {
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
    });
});
