import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContainerState } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

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

describe('DockerService', () => {
    let service: DockerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerService],
        }).compile();

        service = module.get<DockerService>(DockerService);

        // Reset mock container methods
        mockContainer.start.mockReset();
        mockContainer.stop.mockReset();
        mockListContainers.mockReset();
        mockListNetworks.mockReset();
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

        const result = await service.getContainers({ useCache: false });

        expect(result).toEqual([
            {
                id: 'abc123def456',
                autoStart: false,
                command: 'test',
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.EXITED,
                status: 'Exited',
                labels: {},
                hostConfig: {
                    networkMode: 'bridge',
                },
                networkSettings: {},
                mounts: [],
            },
        ]);

        expect(mockListContainers).toHaveBeenCalledWith({
            all: true,
            size: true,
        });
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

        const result = await service.start('abc123def456');

        expect(result).toEqual({
            id: 'abc123def456',
            autoStart: false,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            state: ContainerState.RUNNING,
            status: 'Up 2 hours',
            labels: {},
            hostConfig: {
                networkMode: 'bridge',
            },
            networkSettings: {},
            mounts: [],
        });

        expect(mockContainer.start).toHaveBeenCalled();
        expect(mockListContainers).toHaveBeenCalledWith({
            all: true,
            size: true,
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

        const result = await service.stop('abc123def456');

        expect(result).toEqual({
            id: 'abc123def456',
            autoStart: false,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            state: ContainerState.EXITED,
            status: 'Exited',
            labels: {},
            hostConfig: {
                networkMode: 'bridge',
            },
            networkSettings: {},
            mounts: [],
        });

        expect(mockContainer.stop).toHaveBeenCalledWith({ t: 10 });
        expect(mockListContainers).toHaveBeenCalledWith({
            all: true,
            size: true,
        });
    });

    it('should throw error if container not found after start', async () => {
        mockListContainers.mockResolvedValue([]);
        mockContainer.start.mockResolvedValue(undefined);

        await expect(service.start('not-found')).rejects.toThrow(
            'Container not-found not found after starting'
        );
    });

    it('should throw error if container not found after stop', async () => {
        mockListContainers.mockResolvedValue([]);
        mockContainer.stop.mockResolvedValue(undefined);

        await expect(service.stop('not-found')).rejects.toThrow(
            'Container not-found not found after stopping'
        );
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

        const result = await service.getNetworks({ useCache: false });

        expect(result).toEqual([
            {
                id: 'network1',
                name: 'bridge',
                created: '2023-01-01T00:00:00Z',
                scope: 'local',
                driver: 'bridge',
                enableIpv6: false,
                ipam: {
                    driver: 'default',
                    config: [
                        {
                            subnet: '172.17.0.0/16',
                            gateway: '172.17.0.1',
                        },
                    ],
                },
                internal: false,
                attachable: false,
                ingress: false,
                configFrom: {
                    network: '',
                },
                configOnly: false,
                containers: {},
                options: {
                    comDockerNetworkBridgeDefaultBridge: 'true',
                    comDockerNetworkBridgeEnableIcc: 'true',
                    comDockerNetworkBridgeEnableIpMasquerade: 'true',
                    comDockerNetworkBridgeHostBindingIpv4: '0.0.0.0',
                    comDockerNetworkBridgeName: 'docker0',
                    comDockerNetworkDriverMtu: '1500',
                },
                labels: {},
            },
        ]);

        expect(mockListNetworks).toHaveBeenCalled();
    });

    it('should handle empty networks list', async () => {
        mockListNetworks.mockResolvedValue([]);

        const result = await service.getNetworks({ useCache: false });

        expect(result).toEqual([]);
        expect(mockListNetworks).toHaveBeenCalled();
    });

    it('should handle docker error', async () => {
        const error = new Error('Docker error') as DockerError;
        error.code = 'ENOENT';
        error.address = '/var/run/docker.sock';
        mockListNetworks.mockRejectedValue(error);

        await expect(service.getNetworks({ useCache: false })).rejects.toThrow(
            'Docker socket unavailable.'
        );
        expect(mockListNetworks).toHaveBeenCalled();
    });

    describe('getters', () => {
        it('should return correct installed count', () => {
            // Setup mock containers
            const mockContainers = [
                {
                    id: 'abc123def456',
                    autoStart: false,
                    command: 'test',
                    created: 1234567890,
                    image: 'test-image',
                    imageId: 'test-image-id',
                    ports: [],
                    state: ContainerState.RUNNING,
                    status: 'Up 2 hours',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
                {
                    id: 'def456ghi789',
                    autoStart: false,
                    command: 'test2',
                    created: 1234567891,
                    image: 'test-image2',
                    imageId: 'test-image-id2',
                    ports: [],
                    state: ContainerState.EXITED,
                    status: 'Exited',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
            ];

            // Manually set the container cache
            (service as any).containerCache = mockContainers;

            expect(service.installed).toBe(2);
        });

        it('should return correct running count', () => {
            // Setup mock containers
            const mockContainers = [
                {
                    id: 'abc123def456',
                    autoStart: false,
                    command: 'test',
                    created: 1234567890,
                    image: 'test-image',
                    imageId: 'test-image-id',
                    ports: [],
                    state: ContainerState.RUNNING,
                    status: 'Up 2 hours',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
                {
                    id: 'def456ghi789',
                    autoStart: false,
                    command: 'test2',
                    created: 1234567891,
                    image: 'test-image2',
                    imageId: 'test-image-id2',
                    ports: [],
                    state: ContainerState.EXITED,
                    status: 'Exited',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
            ];

            // Manually set the container cache
            (service as any).containerCache = mockContainers;

            expect(service.running).toBe(1);
        });

        it('should return correct appUpdateEvent', () => {
            // Setup mock containers
            const mockContainers = [
                {
                    id: 'abc123def456',
                    autoStart: false,
                    command: 'test',
                    created: 1234567890,
                    image: 'test-image',
                    imageId: 'test-image-id',
                    ports: [],
                    state: ContainerState.RUNNING,
                    status: 'Up 2 hours',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
                {
                    id: 'def456ghi789',
                    autoStart: false,
                    command: 'test2',
                    created: 1234567891,
                    image: 'test-image2',
                    imageId: 'test-image-id2',
                    ports: [],
                    state: ContainerState.EXITED,
                    status: 'Exited',
                    labels: {},
                    hostConfig: {
                        networkMode: 'bridge',
                    },
                    networkSettings: {},
                    mounts: [],
                },
            ];

            // Manually set the container cache
            (service as any).containerCache = mockContainers;

            expect(service.appUpdateEvent).toEqual({
                info: {
                    apps: { installed: 2, running: 1 },
                },
            });
        });
    });
});
