import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ContainerState,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
// Import the mocked pubsub parts
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';

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
vi.mock('fs/promises', () => ({
    readFile: vi.fn().mockResolvedValue(''),
}));

// Mock Cache Manager
const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
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

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<DockerService>(DockerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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
            size: true,
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
