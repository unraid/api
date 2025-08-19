import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';

// Mock necessary modules
vi.mock('@app/core/utils/misc/get-machine-id.js', () => ({
    getMachineId: vi.fn().mockResolvedValue('test-machine-id-123'),
}));

vi.mock('systeminformation', () => ({
    baseboard: vi.fn().mockResolvedValue({
        manufacturer: 'ASUS',
        model: 'ROG STRIX',
        version: '1.0',
    }),
    system: vi.fn().mockResolvedValue({
        manufacturer: 'ASUS',
        model: 'System Model',
        version: '1.0',
        serial: '123456',
        uuid: 'test-uuid',
    }),
}));

describe('InfoResolver', () => {
    let resolver: InfoResolver;
    let cpuService: CpuService;
    let memoryService: MemoryService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                InfoResolver,
                {
                    provide: CpuService,
                    useValue: {
                        generateCpu: vi.fn().mockResolvedValue({
                            id: 'info/cpu',
                            manufacturer: 'Intel',
                            brand: 'Core i7',
                            cores: 8,
                            threads: 16,
                        }),
                    },
                },
                {
                    provide: MemoryService,
                    useValue: {
                        generateMemory: vi.fn().mockResolvedValue({
                            id: 'info/memory',
                            layout: [
                                {
                                    id: 'mem-1',
                                    size: 8589934592,
                                    bank: 'BANK 0',
                                    type: 'DDR4',
                                },
                            ],
                        }),
                    },
                },
                {
                    provide: DisplayService,
                    useValue: {
                        generateDisplay: vi.fn().mockResolvedValue({
                            id: 'info/display',
                            theme: 'dark',
                            unit: 'metric',
                            scale: true,
                        }),
                    },
                },
                {
                    provide: OsService,
                    useValue: {
                        generateOs: vi.fn().mockResolvedValue({
                            id: 'info/os',
                            platform: 'linux',
                            distro: 'Unraid',
                            release: '6.12.0',
                        }),
                    },
                },
                {
                    provide: VersionsService,
                    useValue: {
                        generateVersions: vi.fn().mockResolvedValue({
                            id: 'info/versions',
                            unraid: '6.12.0',
                        }),
                    },
                },
            ],
        }).compile();

        resolver = module.get<InfoResolver>(InfoResolver);
        cpuService = module.get<CpuService>(CpuService);
        memoryService = module.get<MemoryService>(MemoryService);
    });

    describe('info', () => {
        it('should return basic info object', async () => {
            const result = await resolver.info();
            expect(result).toEqual({
                id: 'info',
            });
        });
    });

    describe('time', () => {
        it('should return current date', async () => {
            const before = new Date();
            const result = await resolver.time();
            const after = new Date();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('baseboard', () => {
        it('should return baseboard data from systeminformation', async () => {
            const result = await resolver.baseboard();
            expect(result).toEqual({
                id: 'info/baseboard',
                manufacturer: 'ASUS',
                model: 'ROG STRIX',
                version: '1.0',
            });
        });
    });

    describe('cpu', () => {
        it('should return full cpu data from service', async () => {
            const result = await resolver.cpu();
            expect(cpuService.generateCpu).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/cpu',
                manufacturer: 'Intel',
                brand: 'Core i7',
                cores: 8,
                threads: 16,
            });
        });
    });

    describe('devices', () => {
        it('should return devices stub for sub-resolver', () => {
            const result = resolver.devices();
            expect(result).toEqual({
                id: 'info/devices',
            });
        });
    });

    describe('display', () => {
        it('should return display data from service', async () => {
            const displayService = module.get<DisplayService>(DisplayService);
            const result = await resolver.display();
            expect(displayService.generateDisplay).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/display',
                theme: 'dark',
                unit: 'metric',
                scale: true,
            });
        });
    });

    describe('machineId', () => {
        it('should return machine id', async () => {
            const { getMachineId } = await import('@app/core/utils/misc/get-machine-id.js');
            const result = await resolver.machineId();
            expect(getMachineId).toHaveBeenCalled();
            expect(result).toBe('test-machine-id-123');
        });
    });

    describe('memory', () => {
        it('should return full memory data from service', async () => {
            const result = await resolver.memory();
            expect(memoryService.generateMemory).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/memory',
                layout: [
                    {
                        id: 'mem-1',
                        size: 8589934592,
                        bank: 'BANK 0',
                        type: 'DDR4',
                    },
                ],
            });
        });
    });

    describe('os', () => {
        it('should return os data from service', async () => {
            const osService = module.get<OsService>(OsService);
            const result = await resolver.os();
            expect(osService.generateOs).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/os',
                platform: 'linux',
                distro: 'Unraid',
                release: '6.12.0',
            });
        });
    });

    describe('system', () => {
        it('should return system data from systeminformation', async () => {
            const result = await resolver.system();
            expect(result).toEqual({
                id: 'info/system',
                manufacturer: 'ASUS',
                model: 'System Model',
                version: '1.0',
                serial: '123456',
                uuid: 'test-uuid',
            });
        });
    });

    describe('versions', () => {
        it('should return versions data from service', async () => {
            const versionsService = module.get<VersionsService>(VersionsService);
            const result = await resolver.versions();
            expect(versionsService.generateVersions).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'info/versions',
                unraid: '6.12.0',
            });
        });
    });
});
