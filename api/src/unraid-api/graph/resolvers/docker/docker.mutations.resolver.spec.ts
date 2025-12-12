import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContainerState, DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

describe('DockerMutationsResolver', () => {
    let resolver: DockerMutationsResolver;
    let dockerService: DockerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerMutationsResolver,
                {
                    provide: DockerService,
                    useValue: {
                        start: vi.fn(),
                        stop: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<DockerMutationsResolver>(DockerMutationsResolver);
        dockerService = module.get<DockerService>(DockerService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('should start', async () => {
        const mockContainer: DockerContainer = {
            id: '1',
            autoStart: false,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            state: ContainerState.RUNNING,
            status: 'Up 2 hours',
            names: ['test-container'],
            isOrphaned: false,
        };
        vi.mocked(dockerService.start).mockResolvedValue(mockContainer);

        const result = await resolver.start('1');
        expect(result).toEqual(mockContainer);
        expect(dockerService.start).toHaveBeenCalledWith('1');
    });

    it('should stop', async () => {
        const mockContainer: DockerContainer = {
            id: '1',
            autoStart: false,
            command: 'test',
            created: 1234567890,
            image: 'test-image',
            imageId: 'test-image-id',
            ports: [],
            state: ContainerState.EXITED,
            status: 'Exited',
            names: ['test-container'],
            isOrphaned: false,
        };
        vi.mocked(dockerService.stop).mockResolvedValue(mockContainer);

        const result = await resolver.stop('1');
        expect(result).toEqual(mockContainer);
        expect(dockerService.stop).toHaveBeenCalledWith('1');
    });
});
