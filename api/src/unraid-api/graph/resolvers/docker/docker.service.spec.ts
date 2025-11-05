import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the mocked pubsub parts
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { ContainerState, DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

// Mock pubsub
vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn().mockResolvedValue(undefined),
    },
    PUBSUB_CHANNEL: {
        INFO: 'info',
    },
}));

interface DockerError extends NodeJS.ErrnoException {
    address: string;
}

const mockContainer = {
    start: vi.fn(),
    stop: vi.fn(),
};

// Create properly typed mock functions
const mockListContainers = vi.fn();
const mockGetContainer = vi.fn().mockReturnValue(mockContainer);
const mockListNetworks = vi.fn();

const mockDockerInstance = {
    getContainer: mockGetContainer,
    listContainers: mockListContainers,
    listNetworks: mockListNetworks,
    modem: {
        Promise: Promise,
        protocol: 'http',
        socketPath: '/var/run/docker.sock',
        headers: {},
        sshOptions: {
            agentForward: undefined,
        },
    },
} as unknown as Docker;

vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => mockDockerInstance),
    };
});

// Mock the store getters
vi.mock('@app/store/index.js', () => ({
    getters: {
        docker: vi.fn().mockReturnValue({ containers: [] }),
        paths: vi.fn().mockReturnValue({
            'docker-autostart': '/path/to/docker-autostart',
            'docker-socket': '/var/run/docker.sock',
            'var-run': '/var/run',
        }),
    },
}));

// Mock fs/promises
const { readFileMock, writeFileMock, unlinkMock } = vi.hoisted(() => ({
    readFileMock: vi.fn().mockResolvedValue(''),
    writeFileMock: vi.fn().mockResolvedValue(undefined),
    unlinkMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs/promises', () => ({
    readFile: readFileMock,
    writeFile: writeFileMock,
    unlink: unlinkMock,
}));

// Mock Cache Manager
const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
};

// Mock DockerConfigService
const mockDockerConfigService = {
    getConfig: vi.fn().mockReturnValue({
        updateCheckCronSchedule: '0 6 * * *',
        templateMappings: {},
        skipTemplatePaths: [],
    }),
    replaceConfig: vi.fn(),
    validate: vi.fn((config) => Promise.resolve(config)),
};

// Mock DockerTemplateScannerService
const mockDockerTemplateScannerService = {
    bootstrapScan: vi.fn().mockResolvedValue(undefined),
    scanTemplates: vi.fn().mockResolvedValue({
        scanned: 0,
        matched: 0,
        skipped: 0,
        errors: [],
    }),
    syncMissingContainers: vi.fn().mockResolvedValue(false),
};

// Mock NotificationsService
const mockNotificationsService = {
    notifyIfUnique: vi.fn().mockResolvedValue(null),
};

describe('DockerService', () => {
    let service: DockerService;

    beforeEach(async () => {
        // Reset mocks before each test
        mockListContainers.mockReset();
        mockListNetworks.mockReset();
        mockContainer.start.mockReset();
        mockContainer.stop.mockReset();
        mockCacheManager.get.mockReset();
        mockCacheManager.set.mockReset();
        mockCacheManager.del.mockReset();
        readFileMock.mockReset();
        readFileMock.mockResolvedValue('');
        writeFileMock.mockReset();
        unlinkMock.mockReset();
        mockDockerConfigService.getConfig.mockReturnValue({
            updateCheckCronSchedule: '0 6 * * *',
            templateMappings: {},
            skipTemplatePaths: [],
        });
        mockDockerTemplateScannerService.bootstrapScan.mockResolvedValue(undefined);
        mockDockerTemplateScannerService.syncMissingContainers.mockResolvedValue(false);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
                {
                    provide: DockerConfigService,
                    useValue: mockDockerConfigService,
                },
                {
                    provide: DockerTemplateScannerService,
                    useValue: mockDockerTemplateScannerService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<DockerService>(DockerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should use separate cache keys for containers with and without size', async () => {
        const mockContainersWithoutSize = [
            {
                Id: 'abc123',
                Names: ['/test-container'],
                Image: 'test-image',
                ImageID: 'test-image-id',
                Command: 'test',
                Created: 1234567890,
                State: 'exited',
                Status: 'Exited',
                Ports: [],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: {},
                Mounts: [],
            },
        ];

        const mockContainersWithSize = [
            {
                Id: 'abc123',
                Names: ['/test-container'],
                Image: 'test-image',
                ImageID: 'test-image-id',
                Command: 'test',
                Created: 1234567890,
                State: 'exited',
                Status: 'Exited',
                Ports: [],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: {},
                Mounts: [],
                SizeRootFs: 1024000,
            },
        ];

        // First call without size
        mockListContainers.mockResolvedValue(mockContainersWithoutSize);
        mockCacheManager.get.mockResolvedValue(undefined);

        await service.getContainers({ size: false });

        expect(mockCacheManager.set).toHaveBeenCalledWith('docker_containers', expect.any(Array), 60000);

        // Second call with size
        mockListContainers.mockResolvedValue(mockContainersWithSize);
        mockCacheManager.get.mockResolvedValue(undefined);

        await service.getContainers({ size: true });

        expect(mockCacheManager.set).toHaveBeenCalledWith(
            'docker_containers_with_size',
            expect.any(Array),
            60000
        );
    });

    it('should get containers', async () => {
        const mockContainers = [
            {
                Id: 'abc123def456',
                Names: ['/test-container'],
                Image: 'test-image',
                ImageID: 'test-image-id',
                Command: 'test',
                Created: 1234567890,
                State: 'exited',
                Status: 'Exited',
                Ports: [],
                Labels: {},
                HostConfig: {
                    NetworkMode: 'bridge',
                },
                NetworkSettings: {},
                Mounts: [],
            },
        ];

        mockListContainers.mockResolvedValue(mockContainers);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss

        const result = await service.getContainers({ skipCache: true }); // Skip cache for direct fetch test

        expect(result).toEqual([
            {
                id: 'abc123def456',
                autoStart: false,
                autoStartOrder: undefined,
                autoStartWait: undefined,
                command: 'test',
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                sizeRootFs: undefined,
                state: ContainerState.EXITED,
                status: 'Exited',
                labels: {},
                hostConfig: {
                    networkMode: 'bridge',
                },
                networkSettings: {},
                mounts: [],
                names: ['/test-container'],
            },
        ]);

        expect(mockListContainers).toHaveBeenCalledWith({
            all: true,
            size: false,
        });
        expect(mockCacheManager.set).toHaveBeenCalled(); // Ensure cache is set
    });

    it('should start container', async () => {
        const mockContainers = [
            {
                Id: 'abc123def456',
                Names: ['/test-container'],
                Image: 'test-image',
                ImageID: 'test-image-id',
                Command: 'test',
                Created: 1234567890,
                State: 'running',
                Status: 'Up 2 hours',
                Ports: [],
                Labels: {},
                HostConfig: {
                    NetworkMode: 'bridge',
                },
                NetworkSettings: {},
                Mounts: [],
            },
        ];

        mockListContainers.mockResolvedValue(mockContainers);
        mockContainer.start.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss for getContainers call

        const result = await service.start('abc123def456');

        expect(result).toEqual({
            id: 'abc123def456',
            autoStart: false,
            autoStartOrder: undefined,
            autoStartWait: undefined,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            sizeRootFs: undefined,
            state: ContainerState.RUNNING,
            status: 'Up 2 hours',
            labels: {},
            hostConfig: {
                networkMode: 'bridge',
            },
            networkSettings: {},
            mounts: [],
            names: ['/test-container'],
        });

        expect(mockContainer.start).toHaveBeenCalled();
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        expect(mockListContainers).toHaveBeenCalled();
        expect(mockCacheManager.set).toHaveBeenCalled();
        expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.INFO, {
            info: {
                apps: { installed: 1, running: 1 },
            },
        });
    });

    it('should stop container', async () => {
        const mockContainers = [
            {
                Id: 'abc123def456',
                Names: ['/test-container'],
                Image: 'test-image',
                ImageID: 'test-image-id',
                Command: 'test',
                Created: 1234567890,
                State: 'exited',
                Status: 'Exited',
                Ports: [],
                Labels: {},
                HostConfig: {
                    NetworkMode: 'bridge',
                },
                NetworkSettings: {},
                Mounts: [],
            },
        ];

        mockListContainers.mockResolvedValue(mockContainers);
        mockContainer.stop.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss for getContainers calls

        const result = await service.stop('abc123def456');

        expect(result).toEqual({
            id: 'abc123def456',
            autoStart: false,
            autoStartOrder: undefined,
            autoStartWait: undefined,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            sizeRootFs: undefined,
            state: ContainerState.EXITED,
            status: 'Exited',
            labels: {},
            hostConfig: {
                networkMode: 'bridge',
            },
            networkSettings: {},
            mounts: [],
            names: ['/test-container'],
        });

        expect(mockContainer.stop).toHaveBeenCalledWith({ t: 10 });
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        expect(mockListContainers).toHaveBeenCalled();
        expect(mockCacheManager.set).toHaveBeenCalled();
        expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.INFO, {
            info: {
                apps: { installed: 1, running: 0 },
            },
        });
    });

    it('should throw error if container not found after start', async () => {
        mockListContainers.mockResolvedValue([]);
        mockContainer.start.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(undefined);

        await expect(service.start('not-found')).rejects.toThrow(
            'Container not-found not found after starting'
        );
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
    });

    it('should throw error if container not found after stop', async () => {
        mockListContainers.mockResolvedValue([]);
        mockContainer.stop.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(undefined);

        await expect(service.stop('not-found')).rejects.toThrow(
            'Container not-found not found after stopping'
        );
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
    });

    it('should update auto-start configuration and persist waits', async () => {
        mockListContainers.mockResolvedValue([
            {
                Id: 'abc123',
                Names: ['/alpha'],
                Image: 'alpha-image',
                ImageID: 'alpha-image-id',
                Command: 'run-alpha',
                Created: 123,
                State: 'running',
                Status: 'Up 1 minute',
                Ports: [],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: {},
                Mounts: [],
            },
            {
                Id: 'def456',
                Names: ['/beta'],
                Image: 'beta-image',
                ImageID: 'beta-image-id',
                Command: 'run-beta',
                Created: 456,
                State: 'running',
                Status: 'Up 1 minute',
                Ports: [],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: {},
                Mounts: [],
            },
        ]);

        await service.updateAutostartConfiguration([
            { id: 'abc123', autoStart: true, wait: 15 },
            { id: 'abc123', autoStart: true, wait: 5 }, // duplicate should be ignored
            { id: 'def456', autoStart: false, wait: 0 },
        ]);

        expect(writeFileMock).toHaveBeenCalledWith('/path/to/docker-autostart', 'alpha 15\n', 'utf8');
        expect(unlinkMock).not.toHaveBeenCalled();
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_WITH_SIZE_CACHE_KEY);
    });

    it('should remove auto-start file when no containers are configured', async () => {
        mockListContainers.mockResolvedValue([
            {
                Id: 'abc123',
                Names: ['/alpha'],
                Image: 'alpha-image',
                ImageID: 'alpha-image-id',
                Command: 'run-alpha',
                Created: 123,
                State: 'running',
                Status: 'Up 1 minute',
                Ports: [],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: {},
                Mounts: [],
            },
        ]);

        await service.updateAutostartConfiguration([{ id: 'abc123', autoStart: false, wait: 30 }]);

        expect(writeFileMock).not.toHaveBeenCalled();
        expect(unlinkMock).toHaveBeenCalledWith('/path/to/docker-autostart');
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_WITH_SIZE_CACHE_KEY);
    });

    it('should get networks', async () => {
        const mockNetworks = [
            {
                Id: 'network1',
                Name: 'bridge',
                Created: '2023-01-01T00:00:00Z',
                Scope: 'local',
                Driver: 'bridge',
                EnableIPv6: false,
                IPAM: {
                    Driver: 'default',
                    Config: [
                        {
                            Subnet: '172.17.0.0/16',
                            Gateway: '172.17.0.1',
                        },
                    ],
                },
                Internal: false,
                Attachable: false,
                Ingress: false,
                ConfigFrom: {
                    Network: '',
                },
                ConfigOnly: false,
                Containers: {},
                Options: {
                    'com.docker.network.bridge.default_bridge': 'true',
                    'com.docker.network.bridge.enable_icc': 'true',
                    'com.docker.network.bridge.enable_ip_masquerade': 'true',
                    'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0',
                    'com.docker.network.bridge.name': 'docker0',
                    'com.docker.network.driver.mtu': '1500',
                },
                Labels: {},
            },
        ];

        mockListNetworks.mockResolvedValue(mockNetworks);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss

        const result = await service.getNetworks({ skipCache: true }); // Skip cache for direct fetch test

        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attachable": false,
              "configFrom": {
                "Network": "",
              },
              "configOnly": false,
              "containers": {},
              "created": "2023-01-01T00:00:00Z",
              "driver": "bridge",
              "enableIPv6": false,
              "id": "network1",
              "ingress": false,
              "internal": false,
              "ipam": {
                "Config": [
                  {
                    "Gateway": "172.17.0.1",
                    "Subnet": "172.17.0.0/16",
                  },
                ],
                "Driver": "default",
              },
              "labels": {},
              "name": "bridge",
              "options": {
                "com.docker.network.bridge.default_bridge": "true",
                "com.docker.network.bridge.enable_icc": "true",
                "com.docker.network.bridge.enable_ip_masquerade": "true",
                "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
                "com.docker.network.bridge.name": "docker0",
                "com.docker.network.driver.mtu": "1500",
              },
              "scope": "local",
            },
          ]
        `);

        expect(mockListNetworks).toHaveBeenCalled();
        expect(mockCacheManager.set).toHaveBeenCalled(); // Ensure cache is set
    });

    it('should handle empty networks list', async () => {
        mockListNetworks.mockResolvedValue([]);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss

        const result = await service.getNetworks({ skipCache: true }); // Skip cache for direct fetch test

        expect(result).toEqual([]);
        expect(mockListNetworks).toHaveBeenCalled();
        expect(mockCacheManager.set).toHaveBeenCalled(); // Ensure cache is set
    });

    it('should handle docker error when getting networks', async () => {
        const error = new Error('Docker error') as DockerError;
        error.code = 'ENOENT';
        error.address = '/var/run/docker.sock';
        mockListNetworks.mockRejectedValue(error);
        mockCacheManager.get.mockResolvedValue(undefined); // Simulate cache miss

        await expect(service.getNetworks({ skipCache: true })).rejects.toThrow(
            'Docker socket unavailable.'
        );
        expect(mockListNetworks).toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled(); // Ensure cache is NOT set on error
    });

    describe('getAppInfo', () => {
        // Common mock containers for these tests
        const mockContainersForMethods = [
            { id: 'abc1', state: ContainerState.RUNNING },
            { id: 'def2', state: ContainerState.EXITED },
        ] as DockerContainer[];

        it('should return correct app info object', async () => {
            // Mock cache response for getContainers call
            mockCacheManager.get.mockResolvedValue(mockContainersForMethods);

            const result = await service.getAppInfo(); // Call the renamed method
            expect(result).toEqual({
                info: {
                    apps: { installed: 2, running: 1 },
                },
            });
            // getContainers should now be called only ONCE from cache
            expect(mockCacheManager.get).toHaveBeenCalledTimes(1);
            expect(mockCacheManager.get).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        });
    });
});
