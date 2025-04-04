import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DockerContainer } from '@app/graphql/generated/api/types.js';
import { ContainerState } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

// Mock chokidar
vi.mock('chokidar', () => ({
    watch: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue({
            on: vi.fn(),
        }),
    }),
}));

// Mock docker-event-emitter
vi.mock('docker-event-emitter', () => ({
    default: vi.fn().mockReturnValue({
        on: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
    }),
}));

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

    describe('watchers', () => {
        it('should setup docker watcher when docker socket is added', async () => {
            // Mock the setupDockerWatch method
            const setupDockerWatchSpy = vi.spyOn(service as any, 'setupDockerWatch');
            setupDockerWatchSpy.mockResolvedValue({} as any);

            // Get the watch function from chokidar
            const { watch } = await import('chokidar');

            // Mock the on method to simulate the add event
            const mockOn = vi.fn().mockImplementation((event, callback) => {
                if (event === 'add') {
                    // Simulate the add event with the docker socket path
                    callback('/var/run/docker.sock');
                }
                return { on: vi.fn() };
            });

            // Replace the watch function's on method
            (watch as any).mockReturnValue({
                on: mockOn,
            });

            // Call the setupVarRunWatch method
            await (service as any).setupVarRunWatch();

            // Verify that setupDockerWatch was called
            expect(setupDockerWatchSpy).toHaveBeenCalled();
        });

        it('should stop docker watcher when docker socket is removed', async () => {
            // Get the watch function from chokidar
            const { watch } = await import('chokidar');

            // Create a mock stop function
            const mockStop = vi.fn();

            // Set up the dockerWatcher before calling setupVarRunWatch
            (service as any).dockerWatcher = { stop: mockStop };

            // Mock the on method to simulate the unlink event
            let unlinkCallback: (path: string) => void = () => {};
            const mockOn = vi.fn().mockImplementation((event, callback) => {
                if (event === 'unlink') {
                    unlinkCallback = callback;
                }
                return { on: mockOn };
            });

            // Replace the watch function's on method
            (watch as any).mockReturnValue({
                on: mockOn,
            });

            // Call the setupVarRunWatch method
            (service as any).setupVarRunWatch();

            // Verify that the on method was called with 'unlink'
            expect(mockOn).toHaveBeenCalledWith('unlink', expect.any(Function));
            expect(unlinkCallback).toBeDefined();

            // Trigger the unlink event
            unlinkCallback('/var/run/docker.sock');

            // Verify that the stop method was called
            expect(mockStop).toHaveBeenCalled();
            expect((service as any).dockerWatcher).toBeNull();
            expect((service as any).containerCache).toEqual([]);
        });

        it('should setup docker watch correctly', async () => {
            // Get the DockerEE import
            const DockerEE = (await import('docker-event-emitter')).default;

            // Mock the debouncedContainerCacheUpdate method
            const debouncedContainerCacheUpdateSpy = vi.spyOn(
                service as any,
                'debouncedContainerCacheUpdate'
            );
            debouncedContainerCacheUpdateSpy.mockResolvedValue(undefined);

            // Call the setupDockerWatch method
            const result = await (service as any).setupDockerWatch();

            // Verify that DockerEE was instantiated with the client
            expect(DockerEE).toHaveBeenCalledWith(mockDockerInstance);

            // Verify that the on method was called with the correct arguments
            const dockerEEInstance = DockerEE();
            expect(dockerEEInstance.on).toHaveBeenCalledWith('container', expect.any(Function));

            // Verify that the start method was called
            expect(dockerEEInstance.start).toHaveBeenCalled();

            // Verify that debouncedContainerCacheUpdate was called
            expect(debouncedContainerCacheUpdateSpy).toHaveBeenCalled();

            // Verify that the result is the DockerEE instance
            expect(result).toBe(dockerEEInstance);
        });

        it('should call debouncedContainerCacheUpdate when container event is received', async () => {
            // Get the DockerEE import
            const DockerEE = (await import('docker-event-emitter')).default;

            // Mock the on method to capture the callback
            const mockOnCallback = vi.fn();
            const mockOn = vi.fn().mockImplementation((event, callback) => {
                if (event === 'container') {
                    mockOnCallback(callback);
                }
                return { on: vi.fn() };
            });

            // Replace the DockerEE constructor's on method
            (DockerEE as any).mockReturnValue({
                on: mockOn,
                start: vi.fn().mockResolvedValue(undefined),
            });

            // Mock the debouncedContainerCacheUpdate method
            const debouncedContainerCacheUpdateSpy = vi.spyOn(
                service as any,
                'debouncedContainerCacheUpdate'
            );
            debouncedContainerCacheUpdateSpy.mockResolvedValue(undefined);

            // Call the setupDockerWatch method
            await (service as any).setupDockerWatch();

            // Get the callback function that was passed to the on method
            const containerEventCallback = mockOnCallback.mock.calls[0][0];

            // Call the callback with a container event
            await containerEventCallback({
                Type: 'container',
                Action: 'start',
                from: 'test-container',
            });

            // Verify that debouncedContainerCacheUpdate was called
            expect(debouncedContainerCacheUpdateSpy).toHaveBeenCalled();
        });

        it('should not call debouncedContainerCacheUpdate for non-watched container events', async () => {
            // Get the DockerEE import
            const DockerEE = (await import('docker-event-emitter')).default;

            // Mock the debouncedContainerCacheUpdate method
            const debouncedContainerCacheUpdateSpy = vi.spyOn(
                service as any,
                'debouncedContainerCacheUpdate'
            );
            debouncedContainerCacheUpdateSpy.mockResolvedValue(undefined);

            // Create a mock on function that captures the callback
            let containerCallback: (data: {
                Type: string;
                Action: string;
                from: string;
            }) => void = () => {};
            const mockOn = vi.fn().mockImplementation((event, callback) => {
                if (event === 'container') {
                    containerCallback = callback;
                }
                return { on: vi.fn() };
            });

            // Replace the DockerEE constructor's on method
            (DockerEE as any).mockReturnValue({
                on: mockOn,
                start: vi.fn().mockResolvedValue(undefined),
            });

            // Call the setupDockerWatch method
            await (service as any).setupDockerWatch();

            // Reset the spy after setup
            debouncedContainerCacheUpdateSpy.mockReset();

            // Call the callback with a non-watched container event
            await containerCallback({
                Type: 'container',
                Action: 'create',
                from: 'test-container',
            });

            // Verify that debouncedContainerCacheUpdate was not called
            expect(debouncedContainerCacheUpdateSpy).not.toHaveBeenCalled();
        });

        it('should call getContainers and publish appUpdateEvent in debouncedContainerCacheUpdate', async () => {
            // Mock the client's listContainers method
            const mockListContainers = vi.fn().mockResolvedValue([]);
            (service as any).client = {
                listContainers: mockListContainers,
            };

            // Mock the getContainers method
            const getContainersSpy = vi.spyOn(service, 'getContainers');

            // Get the pubsub import
            const { pubsub, PUBSUB_CHANNEL } = await import('@app/core/pubsub.js');

            // Call the debouncedContainerCacheUpdate method directly and wait for the debounce
            service['debouncedContainerCacheUpdate']();
            // Force the debounced function to execute immediately
            await new Promise((resolve) => setTimeout(resolve, 600));

            // Verify that getContainers was called with useCache: false
            expect(getContainersSpy).toHaveBeenCalledWith({ useCache: false });

            // Verify that pubsub.publish was called with the correct arguments
            expect(pubsub.publish).toHaveBeenCalledWith('info', {
                info: {
                    apps: { installed: 0, running: 0 },
                },
            });
        });
    });
});
