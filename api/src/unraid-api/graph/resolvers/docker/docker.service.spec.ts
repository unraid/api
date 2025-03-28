import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DockerContainer } from '@app/graphql/generated/api/types.js';
import { getDockerContainers } from '@app/core/modules/docker/get-docker-containers.js';
import { docker } from '@app/core/utils/clients/docker.js';
import { ContainerState } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

vi.mock('@app/core/utils/clients/docker.js', () => ({
    docker: {
        getContainer: vi.fn(),
        listContainers: vi.fn(),
    },
}));

vi.mock('@app/core/modules/docker/get-docker-containers.js', () => ({
    getDockerContainers: vi.fn(),
}));

describe('DockerService', () => {
    let service: DockerService;
    let mockContainer: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerService],
        }).compile();

        service = module.get<DockerService>(DockerService);

        mockContainer = {
            start: vi.fn(),
            stop: vi.fn(),
        };
        vi.mocked(docker.getContainer).mockReturnValue(mockContainer as any);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get containers', async () => {
        const mockContainers: DockerContainer[] = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.EXITED,
                status: 'Exited',
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);

        const result = await service.getContainers(false);
        expect(result).toEqual(mockContainers);
        expect(getDockerContainers).toHaveBeenCalledWith({ useCache: false });
    });

    it('should start container', async () => {
        const mockContainers: DockerContainer[] = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.RUNNING,
                status: 'Up 2 hours',
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);

        const result = await service.startContainer('1');
        expect(result).toEqual(mockContainers[0]);
        expect(docker.getContainer).toHaveBeenCalledWith('1');
        expect(mockContainer.start).toHaveBeenCalled();
        expect(getDockerContainers).toHaveBeenCalledWith({ useCache: false });
    });

    it('should stop container', async () => {
        const mockContainers: DockerContainer[] = [
            {
                id: '1',
                autoStart: false,
                command: 'test',
                created: 1234567890,
                image: 'test-image',
                imageId: 'test-image-id',
                ports: [],
                state: ContainerState.EXITED,
                status: 'Exited',
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);

        const result = await service.stopContainer('1');
        expect(result).toEqual(mockContainers[0]);
        expect(docker.getContainer).toHaveBeenCalledWith('1');
        expect(mockContainer.stop).toHaveBeenCalled();
        expect(getDockerContainers).toHaveBeenCalledWith({ useCache: false });
    });

    it('should throw error if container not found after start', async () => {
        vi.mocked(getDockerContainers).mockResolvedValue([]);

        await expect(service.startContainer('1')).rejects.toThrow(
            'Container 1 not found after starting'
        );
    });

    it('should throw error if container not found after stop', async () => {
        vi.mocked(getDockerContainers).mockResolvedValue([]);

        await expect(service.stopContainer('1')).rejects.toThrow('Container 1 not found after stopping');
    });
});
