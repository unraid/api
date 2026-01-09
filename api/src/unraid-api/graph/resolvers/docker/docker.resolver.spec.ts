import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerStatsService } from '@app/unraid-api/graph/resolvers/docker/docker-stats.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import {
    ContainerState,
    DockerContainer,
    DockerContainerLogs,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';
import { GraphQLFieldHelper } from '@app/unraid-api/utils/graphql-field-helper.js';

vi.mock('@app/unraid-api/utils/graphql-field-helper.js', () => ({
    GraphQLFieldHelper: {
        isFieldRequested: vi.fn(),
    },
}));

describe('DockerResolver', () => {
    let resolver: DockerResolver;
    let dockerService: DockerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerResolver,
                {
                    provide: DockerService,
                    useValue: {
                        getRawContainers: vi.fn(),
                        enrichWithOrphanStatus: vi.fn().mockImplementation((containers) =>
                            containers.map((c: Record<string, unknown>) => ({
                                ...c,
                                isOrphaned: false,
                                templatePath: '/path/to/template.xml',
                            }))
                        ),
                        getNetworks: vi.fn(),
                        getContainerLogSizes: vi.fn(),
                        getContainerLogs: vi.fn(),
                    },
                },
                {
                    provide: DockerConfigService,
                    useValue: {
                        defaultConfig: vi
                            .fn()
                            .mockReturnValue({ templateMappings: {}, skipTemplatePaths: [] }),
                        getConfig: vi
                            .fn()
                            .mockReturnValue({ templateMappings: {}, skipTemplatePaths: [] }),
                        validate: vi.fn().mockImplementation((config) => Promise.resolve(config)),
                        replaceConfig: vi.fn(),
                    },
                },
                {
                    provide: DockerOrganizerService,
                    useValue: {
                        resolveOrganizer: vi.fn(),
                    },
                },
                {
                    provide: DockerPhpService,
                    useValue: {
                        getContainerUpdateStatuses: vi.fn(),
                    },
                },
                {
                    provide: DockerTemplateScannerService,
                    useValue: {
                        scanTemplates: vi.fn().mockResolvedValue({
                            scanned: 0,
                            matched: 0,
                            skipped: 0,
                            errors: [],
                        }),
                        syncMissingContainers: vi.fn().mockResolvedValue(false),
                    },
                },
                {
                    provide: DockerStatsService,
                    useValue: {
                        startStatsStream: vi.fn(),
                        stopStatsStream: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        registerTopic: vi.fn(),
                        subscribe: vi.fn(),
                        unsubscribe: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionHelperService,
                    useValue: {
                        createTrackedSubscription: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<DockerResolver>(DockerResolver);
        dockerService = module.get<DockerService>(DockerService);

        // Reset mocks before each test
        vi.clearAllMocks();
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation(() => false);
        vi.mocked(dockerService.getContainerLogSizes).mockResolvedValue(new Map());
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('should return docker object with id', () => {
        const result = resolver.docker();
        expect(result).toEqual({ id: 'docker' });
    });

    it('should return containers from service', async () => {
        const mockRawContainers = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                names: ['test-container'],
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.EXITED,
                status: 'Exited',
            },
            {
                id: '2',
                autoStart: true,
                command: 'test2',
                names: ['test-container2'],
                created: 1234567891,
                image: 'test-image2',
                imageId: 'test-image-id2',
                ports: [],
                state: ContainerState.RUNNING,
                status: 'Up 2 hours',
            },
        ];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockRawContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation(() => false);

        const mockInfo = {} as any;

        const result = await resolver.containers(false, mockInfo);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ id: '1', isOrphaned: false });
        expect(result[1]).toMatchObject({ id: '2', isOrphaned: false });
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRw');
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeLog');
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: false });
    });

    it('should request size when sizeRootFs field is requested', async () => {
        const mockRawContainers = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                names: ['test-container'],
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                sizeRootFs: 1024000,
                state: ContainerState.EXITED,
                status: 'Exited',
            },
        ];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockRawContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation((_, field) => {
            return field === 'sizeRootFs';
        });

        const mockInfo = {} as any;

        const result = await resolver.containers(false, mockInfo);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: '1', sizeRootFs: 1024000, isOrphaned: false });
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: true });
    });

    it('should request size when sizeRw field is requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation((_, field) => {
            return field === 'sizeRw';
        });

        const mockInfo = {} as any;

        await resolver.containers(false, mockInfo);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRw');
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: true });
    });

    it('should fetch log sizes when sizeLog field is requested', async () => {
        const mockContainers: DockerContainer[] = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                names: ['/test-container'],
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.EXITED,
                status: 'Exited',
                isOrphaned: false,
            },
        ];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation((_, field) => {
            if (field === 'sizeLog') return true;
            return false;
        });

        const logSizeMap = new Map<string, number>([['test-container', 42]]);
        vi.mocked(dockerService.getContainerLogSizes).mockResolvedValue(logSizeMap);

        const mockInfo = {} as any;

        const result = await resolver.containers(false, mockInfo);

        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeLog');
        expect(dockerService.getContainerLogSizes).toHaveBeenCalledWith(['test-container']);
        expect(result[0]?.sizeLog).toBe(42);
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: false });
    });

    it('should request size when GraphQLFieldHelper indicates sizeRootFs is requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation((_, field) => {
            return field === 'sizeRootFs';
        });

        const mockInfo = {} as any;

        await resolver.containers(false, mockInfo);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: true });
    });

    it('should not request size when GraphQLFieldHelper indicates sizeRootFs is not requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockImplementation(() => false);

        const mockInfo = {} as any;

        await resolver.containers(false, mockInfo);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: false });
    });

    it('skipCache parameter is deprecated and ignored', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getRawContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(false);

        const mockInfo = {} as any;

        // skipCache parameter is now deprecated and ignored
        await resolver.containers(true, mockInfo);
        expect(dockerService.getRawContainers).toHaveBeenCalledWith({ size: false });
    });

    it('should fetch container logs with provided arguments', async () => {
        const since = new Date('2024-01-01T00:00:00.000Z');
        const logResult: DockerContainerLogs = {
            containerId: '1',
            lines: [],
            cursor: since,
        };
        vi.mocked(dockerService.getContainerLogs).mockResolvedValue(logResult);

        const result = await resolver.logs('1', since, 25);

        expect(result).toEqual(logResult);
        expect(dockerService.getContainerLogs).toHaveBeenCalledWith('1', {
            since,
            tail: 25,
        });
    });
});
