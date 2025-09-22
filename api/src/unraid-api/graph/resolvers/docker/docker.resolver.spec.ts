import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerFormService } from '@app/unraid-api/graph/resolvers/docker/docker-form.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { ContainerState, DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
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
                        getContainers: vi.fn(),
                        getNetworks: vi.fn(),
                    },
                },
                {
                    provide: DockerFormService,
                    useValue: {
                        getContainerOverviewForm: vi.fn(),
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
            ],
        }).compile();

        resolver = module.get<DockerResolver>(DockerResolver);
        dockerService = module.get<DockerService>(DockerService);

        // Reset mocks before each test
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('should return docker object with id', () => {
        const result = resolver.docker();
        expect(result).toEqual({ id: 'docker' });
    });

    it('should return containers from service', async () => {
        const mockContainers: DockerContainer[] = [
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
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(false);

        const mockInfo = {} as any;

        const result = await resolver.containers(false, mockInfo);
        expect(result).toEqual(mockContainers);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: false });
    });

    it('should request size when sizeRootFs field is requested', async () => {
        const mockContainers: DockerContainer[] = [
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
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(true);

        const mockInfo = {} as any;

        const result = await resolver.containers(false, mockInfo);
        expect(result).toEqual(mockContainers);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: true });
    });

    it('should request size when GraphQLFieldHelper indicates sizeRootFs is requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(true);

        const mockInfo = {} as any;

        await resolver.containers(false, mockInfo);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: true });
    });

    it('should not request size when GraphQLFieldHelper indicates sizeRootFs is not requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(false);

        const mockInfo = {} as any;

        await resolver.containers(false, mockInfo);
        expect(GraphQLFieldHelper.isFieldRequested).toHaveBeenCalledWith(mockInfo, 'sizeRootFs');
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: false });
    });

    it('should handle skipCache parameter', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);
        vi.mocked(GraphQLFieldHelper.isFieldRequested).mockReturnValue(false);

        const mockInfo = {} as any;

        await resolver.containers(true, mockInfo);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: true, size: false });
    });
});
