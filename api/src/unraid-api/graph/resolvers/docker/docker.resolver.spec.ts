import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { ContainerState, DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';

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

        const mockInfo = {
            fieldNodes: [
                {
                    selectionSet: {
                        selections: [],
                    },
                },
            ],
        } as any;

        const result = await resolver.containers(false, mockInfo);
        expect(result).toEqual(mockContainers);
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

        const mockInfoWithSize = {
            fieldNodes: [
                {
                    selectionSet: {
                        selections: [
                            {
                                kind: 'Field',
                                name: { value: 'sizeRootFs' },
                            },
                        ],
                    },
                },
            ],
        } as any;

        const result = await resolver.containers(false, mockInfoWithSize);
        expect(result).toEqual(mockContainers);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: true });
    });

    it('should request size when inline fragment is present', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);

        const mockInfoWithFragment = {
            fieldNodes: [
                {
                    selectionSet: {
                        selections: [
                            {
                                kind: 'InlineFragment',
                            },
                        ],
                    },
                },
            ],
        } as any;

        await resolver.containers(false, mockInfoWithFragment);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: true });
    });

    it('should request size when fragment spread is present', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);

        const mockInfoWithFragmentSpread = {
            fieldNodes: [
                {
                    selectionSet: {
                        selections: [
                            {
                                kind: 'FragmentSpread',
                            },
                        ],
                    },
                },
            ],
        } as any;

        await resolver.containers(false, mockInfoWithFragmentSpread);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: true });
    });

    it('should not request size when other fields are requested', async () => {
        const mockContainers: DockerContainer[] = [];
        vi.mocked(dockerService.getContainers).mockResolvedValue(mockContainers);

        const mockInfoWithOtherFields = {
            fieldNodes: [
                {
                    selectionSet: {
                        selections: [
                            {
                                kind: 'Field',
                                name: { value: 'id' },
                            },
                            {
                                kind: 'Field',
                                name: { value: 'names' },
                            },
                            {
                                kind: 'Field',
                                name: { value: 'state' },
                            },
                        ],
                    },
                },
            ],
        } as any;

        await resolver.containers(false, mockInfoWithOtherFields);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false, size: false });
    });
});
