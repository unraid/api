import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DockerContainer } from '@app/graphql/generated/api/types.js';
import { ContainerState } from '@app/graphql/generated/api/types.js';
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
                        startContainer: vi.fn(),
                        stopContainer: vi.fn(),
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

    it('should start container', async () => {
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
        };
        vi.mocked(dockerService.startContainer).mockResolvedValue(mockContainer);

        const result = await resolver.startContainer('1');
        expect(result).toEqual(mockContainer);
        expect(dockerService.startContainer).toHaveBeenCalledWith('1');
    });

    it('should stop container', async () => {
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
        };
        vi.mocked(dockerService.stopContainer).mockResolvedValue(mockContainer);

        const result = await resolver.stopContainer('1');
        expect(result).toEqual(mockContainer);
        expect(dockerService.stopContainer).toHaveBeenCalledWith('1');
    });
});
