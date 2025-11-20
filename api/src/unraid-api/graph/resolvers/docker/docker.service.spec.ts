import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the mocked pubsub parts
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { DockerAutostartService } from '@app/unraid-api/graph/resolvers/docker/docker-autostart.service.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
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

const { mockDockerInstance, mockListContainers, mockGetContainer, mockListNetworks, mockContainer } =
    vi.hoisted(() => {
        const mockContainer = {
            start: vi.fn(),
            stop: vi.fn(),
            pause: vi.fn(),
            unpause: vi.fn(),
            inspect: vi.fn(),
        };

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

        return {
            mockDockerInstance,
            mockListContainers,
            mockGetContainer,
            mockListNetworks,
            mockContainer,
        };
    });

vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => mockDockerInstance),
    };
});

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

const { mockEmhttpGetter } = vi.hoisted(() => ({
    mockEmhttpGetter: vi.fn().mockReturnValue({
        networks: [],
        var: {},
    }),
}));

// Mock the store getters
vi.mock('@app/store/index.js', () => ({
    getters: {
        docker: vi.fn().mockReturnValue({ containers: [] }),
        paths: vi.fn().mockReturnValue({
            'docker-autostart': '/path/to/docker-autostart',
            'docker-userprefs': '/path/to/docker-userprefs',
            'docker-socket': '/var/run/docker.sock',
            'var-run': '/var/run',
        }),
        emhttp: mockEmhttpGetter,
    },
}));

// Mock fs/promises (stat only)
const { statMock } = vi.hoisted(() => ({
    statMock: vi.fn().mockResolvedValue({ size: 0 }),
}));

vi.mock('fs/promises', () => ({
    stat: statMock,
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

const mockDockerManifestService = {
    refreshDigests: vi.fn().mockResolvedValue(true),
    getCachedUpdateStatuses: vi.fn().mockResolvedValue({}),
    isUpdateAvailableCached: vi.fn().mockResolvedValue(false),
};

// Mock NotificationsService
const mockNotificationsService = {
    notifyIfUnique: vi.fn().mockResolvedValue(null),
};

// Mock DockerAutostartService
const mockDockerAutostartService = {
    refreshAutoStartEntries: vi.fn().mockResolvedValue(undefined),
    getAutoStarts: vi.fn().mockResolvedValue([]),
    getContainerPrimaryName: vi.fn((c) => {
        if ('Names' in c) return c.Names[0]?.replace(/^\//, '') || null;
        if ('names' in c) return c.names[0]?.replace(/^\//, '') || null;
        return null;
    }),
    getAutoStartEntry: vi.fn(),
    updateAutostartConfiguration: vi.fn().mockResolvedValue(undefined),
};

describe('DockerService', () => {
    let service: DockerService;

    beforeEach(async () => {
        // Reset mocks before each test
        mockListContainers.mockReset();
        mockListNetworks.mockReset();
        mockContainer.start.mockReset();
        mockContainer.stop.mockReset();
        mockContainer.pause.mockReset();
        mockContainer.unpause.mockReset();
        mockContainer.inspect.mockReset();

        mockCacheManager.get.mockReset();
        mockCacheManager.set.mockReset();
        mockCacheManager.del.mockReset();
        statMock.mockReset();
        statMock.mockResolvedValue({ size: 0 });

        mockEmhttpGetter.mockReset();
        mockEmhttpGetter.mockReturnValue({
            networks: [],
            var: {},
        });
        mockDockerConfigService.getConfig.mockReturnValue({
            updateCheckCronSchedule: '0 6 * * *',
            templateMappings: {},
            skipTemplatePaths: [],
        });
        mockDockerManifestService.refreshDigests.mockReset();
        mockDockerManifestService.refreshDigests.mockResolvedValue(true);

        mockDockerAutostartService.refreshAutoStartEntries.mockReset();
        mockDockerAutostartService.getAutoStarts.mockReset();
        mockDockerAutostartService.getAutoStartEntry.mockReset();
        mockDockerAutostartService.updateAutostartConfiguration.mockReset();

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
                    provide: DockerManifestService,
                    useValue: mockDockerManifestService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
                {
                    provide: DockerAutostartService,
                    useValue: mockDockerAutostartService,
                },
            ],
        }).compile();

        service = module.get<DockerService>(DockerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ... most tests remain similar but no file I/O assertions ...

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
        mockCacheManager.get.mockResolvedValue(undefined);

        const result = await service.getContainers({ skipCache: true });

        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'abc123def456',
                    names: ['/test-container'],
                }),
            ])
        );

        expect(mockListContainers).toHaveBeenCalled();
        expect(mockDockerAutostartService.refreshAutoStartEntries).toHaveBeenCalled();
    });

    it('should update auto-start configuration', async () => {
        mockListContainers.mockResolvedValue([
            {
                Id: 'abc123',
                Names: ['/alpha'],
                State: 'running',
            },
        ]);

        const input = [{ id: 'abc123', autoStart: true, wait: 15 }];
        await service.updateAutostartConfiguration(input, { persistUserPreferences: true });

        expect(mockDockerAutostartService.updateAutostartConfiguration).toHaveBeenCalledWith(
            input,
            expect.any(Array),
            { persistUserPreferences: true }
        );
        expect(mockCacheManager.del).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
    });

    it('should get container log sizes using dockerode inspect', async () => {
        mockContainer.inspect.mockResolvedValue({
            LogPath: '/var/lib/docker/containers/id/id-json.log',
        });
        statMock.mockResolvedValue({ size: 1024 });

        const sizes = await service.getContainerLogSizes(['test-container']);

        expect(mockGetContainer).toHaveBeenCalledWith('test-container');
        expect(mockContainer.inspect).toHaveBeenCalled();
        expect(statMock).toHaveBeenCalledWith('/var/lib/docker/containers/id/id-json.log');
        expect(sizes.get('test-container')).toBe(1024);
    });

    describe('getAppInfo', () => {
        const mockContainersForMethods = [
            { id: 'abc1', state: ContainerState.RUNNING },
            { id: 'def2', state: ContainerState.EXITED },
        ] as DockerContainer[];

        it('should return correct app info object', async () => {
            mockCacheManager.get.mockResolvedValue(mockContainersForMethods);

            const result = await service.getAppInfo();
            expect(result).toEqual({
                info: {
                    apps: { installed: 2, running: 1 },
                },
            });
            expect(mockCacheManager.get).toHaveBeenCalledWith(DockerService.CONTAINER_CACHE_KEY);
        });
    });

    describe('transformContainer', () => {
        it('deduplicates ports that only differ by bound IP addresses', () => {
            mockEmhttpGetter.mockReturnValue({
                networks: [{ ipaddr: ['192.168.0.10'] }],
                var: {},
            });

            const container = {
                Id: 'duplicate-ports',
                Names: ['/duplicate-ports'],
                Image: 'test-image',
                ImageID: 'sha256:123',
                Command: 'test',
                Created: 1700000000,
                State: 'running',
                Status: 'Up 2 hours',
                Ports: [
                    { IP: '0.0.0.0', PrivatePort: 8080, PublicPort: 8080, Type: 'tcp' },
                    { IP: '::', PrivatePort: 8080, PublicPort: 8080, Type: 'tcp' },
                    { IP: '0.0.0.0', PrivatePort: 5000, PublicPort: 5000, Type: 'udp' },
                ],
                Labels: {},
                HostConfig: { NetworkMode: 'bridge' },
                NetworkSettings: { Networks: {} },
                Mounts: [],
            } as Docker.ContainerInfo;

            const transformed = service.transformContainer(container);

            expect(transformed.ports).toEqual([
                {
                    ip: '0.0.0.0',
                    privatePort: 8080,
                    publicPort: 8080,
                    type: ContainerPortType.TCP,
                },
                {
                    ip: '0.0.0.0',
                    privatePort: 5000,
                    publicPort: 5000,
                    type: ContainerPortType.UDP,
                },
            ]);
            expect(transformed.lanIpPorts).toEqual(['192.168.0.10:8080', '192.168.0.10:5000']);
        });
    });
});
