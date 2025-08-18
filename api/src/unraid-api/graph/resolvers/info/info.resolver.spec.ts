import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DisplayService } from '@app/unraid-api/graph/resolvers/display/display.service.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { CpuDataService } from '@app/unraid-api/graph/resolvers/info/cpu-data.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

// Mock necessary modules
vi.mock('fs/promises', () => ({
    readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn().mockResolvedValue(undefined),
    },
    PUBSUB_CHANNEL: {
        INFO: 'info',
    },
    createSubscription: vi.fn().mockReturnValue('mock-subscription'),
}));

vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            listContainers: vi.fn(),
            listNetworks: vi.fn(),
        })),
    };
});

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => ({
            'docker-autostart': '/path/to/docker-autostart',
        }),
    },
}));

vi.mock('systeminformation', () => ({
    baseboard: vi.fn().mockResolvedValue({
        manufacturer: 'ASUS',
        model: 'PRIME X570-P',
        version: 'Rev X.0x',
        serial: 'ABC123',
        assetTag: 'Default string',
    }),
    system: vi.fn().mockResolvedValue({
        manufacturer: 'ASUS',
        model: 'System Product Name',
        version: 'System Version',
        serial: 'System Serial Number',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'SKU',
    }),
}));

vi.mock('@app/core/utils/misc/get-machine-id.js', () => ({
    getMachineId: vi.fn().mockResolvedValue('test-machine-id-123'),
}));

// Mock Cache Manager
const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
};

describe('InfoResolver', () => {
    let resolver: InfoResolver;

    // Mock data for testing
    const mockAppsData = {
        id: 'info/apps',
        installed: 5,
        started: 3,
    };

    const mockCpuData = {
        id: 'info/cpu',
        manufacturer: 'AMD',
        brand: 'AMD Ryzen 9 5900X',
        vendor: 'AMD',
        family: '19',
        model: '33',
        stepping: 0,
        revision: '',
        voltage: '1.4V',
        speed: 3.7,
        speedmin: 2.2,
        speedmax: 4.8,
        threads: 24,
        cores: 12,
        processors: 1,
        socket: 'AM4',
        cache: { l1d: 32768, l1i: 32768, l2: 524288, l3: 33554432 },
        flags: ['fpu', 'vme', 'de', 'pse'],
    };

    const mockDevicesData = {
        id: 'info/devices',
        gpu: [],
        pci: [],
        usb: [],
    };

    const mockDisplayData = {
        id: 'display',
        case: {
            url: '',
            icon: 'default',
            error: '',
            base64: '',
        },
        theme: 'black',
        unit: 'C',
        scale: true,
        tabs: false,
        resize: true,
        wwn: false,
        total: true,
        usage: false,
        text: true,
        warning: 40,
        critical: 50,
        hot: 60,
        max: 80,
        locale: 'en_US',
    };

    const mockMemoryData = {
        id: 'info/memory',
        max: 68719476736,
        total: 67108864000,
        free: 33554432000,
        used: 33554432000,
        active: 16777216000,
        available: 50331648000,
        buffcache: 8388608000,
        swaptotal: 4294967296,
        swapused: 0,
        swapfree: 4294967296,
        layout: [],
    };

    const mockOsData = {
        id: 'info/os',
        platform: 'linux',
        distro: 'Unraid',
        release: '6.12.0',
        codename: '',
        kernel: '6.1.0-unraid',
        arch: 'x64',
        hostname: 'Tower',
        codepage: 'UTF-8',
        logofile: 'unraid',
        serial: '',
        build: '',
        uptime: '2024-01-01T00:00:00.000Z',
    };

    const mockVersionsData = {
        id: 'info/versions',
        unraid: '6.12.0',
        kernel: '6.1.0',
        node: '20.10.0',
        npm: '10.2.3',
        docker: '24.0.7',
    };

    // Mock InfoService
    const mockInfoService = {
        generateApps: vi.fn().mockResolvedValue(mockAppsData),
        generateCpu: vi.fn().mockResolvedValue(mockCpuData),
        generateDevices: vi.fn().mockResolvedValue(mockDevicesData),
        generateMemory: vi.fn().mockResolvedValue(mockMemoryData),
        generateOs: vi.fn().mockResolvedValue(mockOsData),
        generateVersions: vi.fn().mockResolvedValue(mockVersionsData),
    };

    // Mock DisplayService
    const mockDisplayService = {
        generateDisplay: vi.fn().mockResolvedValue(mockDisplayData),
    };

    const mockSubscriptionTrackerService = {
        registerTopic: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    };

    const mockCpuDataService = {
        getCpuLoad: vi.fn().mockResolvedValue({
            currentLoad: 10,
            cpus: [],
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InfoResolver,
                {
                    provide: InfoService,
                    useValue: mockInfoService,
                },
                {
                    provide: DisplayService,
                    useValue: mockDisplayService,
                },
                {
                    provide: DockerService,
                    useValue: {},
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
                {
                    provide: SubscriptionTrackerService,
                    useValue: mockSubscriptionTrackerService,
                },
                {
                    provide: CpuDataService,
                    useValue: mockCpuDataService,
                },
            ],
        }).compile();

        resolver = module.get<InfoResolver>(InfoResolver);

        // Reset mocks before each test
        vi.clearAllMocks();
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
            const beforeCall = new Date();
            const result = await resolver.time();
            const afterCall = new Date();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });
    });

    describe('apps', () => {
        it('should return apps info from service', async () => {
            const result = await resolver.apps();

            expect(mockInfoService.generateApps).toHaveBeenCalledOnce();
            expect(result).toEqual(mockAppsData);
        });
    });

    describe('baseboard', () => {
        it('should return baseboard info with id', async () => {
            const result = await resolver.baseboard();

            expect(result).toEqual({
                id: 'baseboard',
                manufacturer: 'ASUS',
                model: 'PRIME X570-P',
                version: 'Rev X.0x',
                serial: 'ABC123',
                assetTag: 'Default string',
            });
        });
    });

    describe('cpu', () => {
        it('should return cpu info from service', async () => {
            const result = await resolver.cpu();

            expect(mockInfoService.generateCpu).toHaveBeenCalledOnce();
            expect(result).toEqual(mockCpuData);
        });
    });

    describe('devices', () => {
        it('should return devices info from service', async () => {
            const result = await resolver.devices();

            expect(mockInfoService.generateDevices).toHaveBeenCalledOnce();
            expect(result).toEqual(mockDevicesData);
        });
    });

    describe('display', () => {
        it('should return display info from display service', async () => {
            const result = await resolver.display();

            expect(mockDisplayService.generateDisplay).toHaveBeenCalledOnce();
            expect(result).toEqual(mockDisplayData);
        });
    });

    describe('machineId', () => {
        it('should return machine id', async () => {
            const result = await resolver.machineId();

            expect(result).toBe('test-machine-id-123');
        });

        it('should handle getMachineId errors gracefully', async () => {
            const { getMachineId } = await import('@app/core/utils/misc/get-machine-id.js');
            vi.mocked(getMachineId).mockRejectedValueOnce(new Error('Machine ID error'));

            await expect(resolver.machineId()).rejects.toThrow('Machine ID error');
        });
    });

    describe('memory', () => {
        it('should return memory info from service', async () => {
            const result = await resolver.memory();

            expect(mockInfoService.generateMemory).toHaveBeenCalledOnce();
            expect(result).toEqual(mockMemoryData);
        });
    });

    describe('os', () => {
        it('should return os info from service', async () => {
            const result = await resolver.os();

            expect(mockInfoService.generateOs).toHaveBeenCalledOnce();
            expect(result).toEqual(mockOsData);
        });
    });

    describe('system', () => {
        it('should return system info with id', async () => {
            const result = await resolver.system();

            expect(result).toEqual({
                id: 'system',
                manufacturer: 'ASUS',
                model: 'System Product Name',
                version: 'System Version',
                serial: 'System Serial Number',
                uuid: '550e8400-e29b-41d4-a716-446655440000',
                sku: 'SKU',
            });
        });
    });

    describe('versions', () => {
        it('should return versions info from service', async () => {
            const result = await resolver.versions();

            expect(mockInfoService.generateVersions).toHaveBeenCalledOnce();
            expect(result).toEqual(mockVersionsData);
        });
    });

    describe('infoSubscription', () => {
        it('should create and return subscription', async () => {
            const { createSubscription, PUBSUB_CHANNEL } = await import('@app/core/pubsub.js');

            const result = await resolver.infoSubscription();

            expect(createSubscription).toHaveBeenCalledWith(PUBSUB_CHANNEL.INFO);
            expect(result).toBe('mock-subscription');
        });
    });

    describe('error handling', () => {
        it('should handle baseboard errors gracefully', async () => {
            const { baseboard } = await import('systeminformation');
            vi.mocked(baseboard).mockRejectedValueOnce(new Error('Baseboard error'));

            await expect(resolver.baseboard()).rejects.toThrow('Baseboard error');
        });

        it('should handle system errors gracefully', async () => {
            const { system } = await import('systeminformation');
            vi.mocked(system).mockRejectedValueOnce(new Error('System error'));

            await expect(resolver.system()).rejects.toThrow('System error');
        });

        it('should handle service errors gracefully', async () => {
            mockInfoService.generateApps.mockRejectedValueOnce(new Error('Service error'));

            await expect(resolver.apps()).rejects.toThrow('Service error');
        });
    });
});
