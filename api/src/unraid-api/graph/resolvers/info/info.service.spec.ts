import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContainerState } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';

// Mock external dependencies
vi.mock('fs/promises', () => ({
    access: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

vi.mock('path-type', () => ({
    isSymlink: vi.fn().mockResolvedValue(false),
}));

vi.mock('systeminformation', () => ({
    cpu: vi.fn(),
    cpuFlags: vi.fn(),
    mem: vi.fn(),
    memLayout: vi.fn(),
    osInfo: vi.fn(),
    versions: vi.fn(),
}));

vi.mock('@app/common/dashboard/boot-timestamp.js', () => ({
    bootTimestamp: new Date('2024-01-01T00:00:00.000Z'),
}));

vi.mock('@app/common/dashboard/get-unraid-version.js', () => ({
    getUnraidVersion: vi.fn(),
}));

vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn().mockResolvedValue(undefined),
    },
    PUBSUB_CHANNEL: {
        INFO: 'info',
    },
}));

vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            listContainers: vi.fn(),
            listNetworks: vi.fn(),
        })),
    };
});

vi.mock('@app/core/utils/misc/clean-stdout.js', () => ({
    cleanStdout: vi.fn((input) => input),
}));

vi.mock('bytes', () => ({
    default: vi.fn((value) => {
        if (value === '32 GB') return 34359738368;
        if (value === '16 GB') return 17179869184;
        if (value === '4 GB') return 4294967296;
        return 0;
    }),
}));

vi.mock('@app/core/utils/misc/load-state.js', () => ({
    loadState: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: () => ({
            var: {
                name: 'test-hostname',
                flashGuid: 'test-flash-guid',
            },
        }),
        paths: () => ({
            'dynamix-config': ['/test/config/path'],
            'docker-autostart': '/path/to/docker-autostart',
        }),
    },
}));

// Mock Cache Manager
const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
};

describe('InfoService', () => {
    let service: InfoService;
    let dockerService: DockerService;
    let mockSystemInfo: any;
    let mockExeca: any;
    let mockGetUnraidVersion: any;
    let mockLoadState: any;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();
        mockCacheManager.get.mockReset();
        mockCacheManager.set.mockReset();
        mockCacheManager.del.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InfoService,
                DockerService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<InfoService>(InfoService);
        dockerService = module.get<DockerService>(DockerService);

        // Get mock references
        mockSystemInfo = await import('systeminformation');
        mockExeca = await import('execa');
        mockGetUnraidVersion = await import('@app/common/dashboard/get-unraid-version.js');
        mockLoadState = await import('@app/core/utils/misc/load-state.js');
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateApps', () => {
        it('should return docker container statistics', async () => {
            const mockContainers = [
                { id: '1', state: ContainerState.RUNNING },
                { id: '2', state: ContainerState.EXITED },
                { id: '3', state: ContainerState.RUNNING },
            ];

            mockCacheManager.get.mockResolvedValue(mockContainers);

            const result = await service.generateApps();

            expect(result).toEqual({
                id: 'info/apps',
                installed: 3,
                started: 2,
            });
        });

        it('should handle docker errors gracefully', async () => {
            mockCacheManager.get.mockResolvedValue([]);

            const result = await service.generateApps();

            expect(result).toEqual({
                id: 'info/apps',
                installed: 0,
                started: 0,
            });
        });
    });

    describe('generateOs', () => {
        it('should return OS information with hostname and uptime', async () => {
            const mockOsInfo = {
                platform: 'linux',
                distro: 'Unraid',
                release: '6.12.0',
                kernel: '6.1.0-unraid',
            };

            mockSystemInfo.osInfo.mockResolvedValue(mockOsInfo);

            const result = await service.generateOs();

            expect(result).toEqual({
                id: 'info/os',
                ...mockOsInfo,
                hostname: 'test-hostname',
                uptime: '2024-01-01T00:00:00.000Z',
            });
        });
    });

    describe('generateCpu', () => {
        it('should return CPU information with proper mapping', async () => {
            const mockCpuInfo = {
                manufacturer: 'Intel',
                brand: 'Intel(R) Core(TM) i7-9700K',
                family: '6',
                model: '158',
                cores: 16,
                physicalCores: 8,
                speedMin: 800,
                speedMax: 4900,
                stepping: '10',
                cache: { l1d: 32768 },
            };

            const mockFlags = 'fpu vme de pse tsc msr pae mce';

            mockSystemInfo.cpu.mockResolvedValue(mockCpuInfo);
            mockSystemInfo.cpuFlags.mockResolvedValue(mockFlags);

            const result = await service.generateCpu();

            expect(result).toEqual({
                id: 'info/cpu',
                manufacturer: 'Intel',
                brand: 'Intel(R) Core(TM) i7-9700K',
                family: '6',
                model: '158',
                cores: 8, // physicalCores
                threads: 16, // cores
                flags: ['fpu', 'vme', 'de', 'pse', 'tsc', 'msr', 'pae', 'mce'],
                stepping: 10,
                speedmin: 800,
                speedmax: 4900,
                cache: { l1d: 32768 },
            });
        });

        it('should handle missing speed values', async () => {
            const mockCpuInfo = {
                manufacturer: 'AMD',
                cores: 12,
                physicalCores: 6,
                stepping: '2',
            };

            mockSystemInfo.cpu.mockResolvedValue(mockCpuInfo);
            mockSystemInfo.cpuFlags.mockResolvedValue('sse sse2');

            const result = await service.generateCpu();

            expect(result.speedmin).toBe(-1);
            expect(result.speedmax).toBe(-1);
        });

        it('should handle cpuFlags error gracefully', async () => {
            mockSystemInfo.cpu.mockResolvedValue({ cores: 8, physicalCores: 4, stepping: '1' });
            mockSystemInfo.cpuFlags.mockRejectedValue(new Error('CPU flags error'));

            const result = await service.generateCpu();

            expect(result.flags).toEqual([]);
        });
    });

    describe('generateDisplay', () => {
        it('should return display configuration with default values', async () => {
            mockLoadState.loadState.mockReturnValue(null);

            const result = await service.generateDisplay();

            expect(result).toEqual({
                id: 'dynamix-config/display',
            });
        });

        it('should return parsed display configuration', async () => {
            const mockDisplayConfig = {
                display: {
                    theme: 'dark',
                    unit: 'celsius',
                    scale: 'yes',
                    tabs: 'no',
                    resize: 'yes',
                    wwn: 'no',
                    total: 'yes',
                    usage: 'no',
                    text: 'yes',
                    warning: '40',
                    critical: '50',
                    hot: '60',
                    max: '70',
                    locale: 'en_US',
                },
            };

            mockLoadState.loadState.mockReturnValue(mockDisplayConfig);

            const result = await service.generateDisplay();

            expect(result).toEqual({
                id: 'dynamix-config/display',
                theme: 'dark',
                unit: 'celsius',
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
                max: 70,
                locale: 'en_US',
            });
        });
    });

    describe('generateVersions', () => {
        it('should return version information', async () => {
            const mockUnraidVersion = '6.12.0';
            const mockSoftwareVersions = {
                node: '18.17.0',
                npm: '9.6.7',
                docker: '24.0.0',
            };

            mockGetUnraidVersion.getUnraidVersion.mockResolvedValue(mockUnraidVersion);
            mockSystemInfo.versions.mockResolvedValue(mockSoftwareVersions);

            const result = await service.generateVersions();

            expect(result).toEqual({
                id: 'info/versions',
                unraid: '6.12.0',
                node: '18.17.0',
                npm: '9.6.7',
                docker: '24.0.0',
            });
        });
    });

    describe('generateMemory', () => {
        it('should return memory information with layout', async () => {
            const mockMemLayout = [
                {
                    size: 8589934592,
                    bank: 'BANK 0',
                    type: 'DDR4',
                    clockSpeed: 3200,
                },
            ];

            const mockMemInfo = {
                total: 17179869184,
                free: 8589934592,
                used: 8589934592,
                active: 4294967296,
                available: 12884901888,
            };

            mockSystemInfo.memLayout.mockResolvedValue(mockMemLayout);
            mockSystemInfo.mem.mockResolvedValue(mockMemInfo);

            const result = await service.generateMemory();

            expect(result).toEqual({
                id: 'info/memory',
                layout: mockMemLayout,
                max: mockMemInfo.total, // No dmidecode output, so max = total
                ...mockMemInfo,
            });
        });

        it('should handle memLayout error gracefully', async () => {
            mockSystemInfo.memLayout.mockRejectedValue(new Error('Memory layout error'));
            mockSystemInfo.mem.mockResolvedValue({ total: 1000 });

            const result = await service.generateMemory();

            expect(result.layout).toEqual([]);
        });

        it('should handle dmidecode parsing for maximum capacity', async () => {
            mockSystemInfo.memLayout.mockResolvedValue([]);
            mockSystemInfo.mem.mockResolvedValue({ total: 16000000000 });
            // Mock dmidecode command to throw error (simulating no dmidecode available)
            mockExeca.execa.mockRejectedValue(new Error('dmidecode not found'));

            const result = await service.generateMemory();

            // Should fallback to using mem.total when dmidecode fails
            expect(result.max).toBe(16000000000);
            expect(result.id).toBe('info/memory');
        });
    });

    describe('generateDevices', () => {
        it('should return basic devices object with empty arrays', async () => {
            const result = await service.generateDevices();

            expect(result).toEqual({
                id: 'info/devices',
                gpu: [],
                pci: [],
                usb: [],
            });
        });
    });
});
