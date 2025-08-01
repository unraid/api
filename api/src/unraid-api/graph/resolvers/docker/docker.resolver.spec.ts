import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import { ContainerState, DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

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
                        getResolvedOrganizer: vi.fn(),
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

        const result = await resolver.containers(false);
        expect(result).toEqual(mockContainers);
        expect(dockerService.getContainers).toHaveBeenCalledWith({ skipCache: false });
    });
});
