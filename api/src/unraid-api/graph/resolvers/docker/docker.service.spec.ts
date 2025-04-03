import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import Docker from 'dockerode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DockerContainer } from '@app/graphql/generated/api/types.js';
import { getDockerContainers } from '@app/core/modules/docker/get-docker-containers.js';
import { ContainerState } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

const mockContainer = {
    start: vi.fn(),
    stop: vi.fn(),
};

const mockDockerInstance = {
    getContainer: vi.fn().mockReturnValue(mockContainer),
    listContainers: vi.fn(),
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

vi.mock('@app/core/modules/docker/get-docker-containers.js', () => ({
    getDockerContainers: vi.fn(),
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
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get containers', async () => {
        const mockContainers: DockerContainer[] = [
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
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);

        const result = await service.getContainers({ useCache: false, docker: mockDockerInstance });
        expect(result).toEqual(mockContainers);
        expect(getDockerContainers).toHaveBeenCalledWith({
            useCache: false,
            docker: expect.objectContaining({
                getContainer: expect.any(Function),
                listContainers: expect.any(Function),
                modem: expect.any(Object),
            }),
        });
    });

    it('should start container', async () => {
        const mockContainers: DockerContainer[] = [
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
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);
        mockContainer.start.mockResolvedValue(undefined);

        const result = await service.startContainer('abc123def456');
        expect(result).toEqual(mockContainers[0]);
        expect(mockContainer.start).toHaveBeenCalled();
        expect(getDockerContainers).toHaveBeenCalledWith({
            useCache: false,
            docker: expect.objectContaining({
                getContainer: expect.any(Function),
                listContainers: expect.any(Function),
                modem: expect.any(Object),
            }),
        });
    });

    it('should stop container', async () => {
        const mockContainers: DockerContainer[] = [
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
            },
        ];
        vi.mocked(getDockerContainers).mockResolvedValue(mockContainers);
        mockContainer.stop.mockResolvedValue(undefined);

        const result = await service.stopContainer('abc123def456');
        expect(result).toEqual(mockContainers[0]);
        expect(mockContainer.stop).toHaveBeenCalled();
        expect(getDockerContainers).toHaveBeenCalledWith({
            useCache: false,
            docker: expect.objectContaining({
                getContainer: expect.any(Function),
                listContainers: expect.any(Function),
                modem: expect.any(Object),
            }),
        });
    });

    it('should throw error if container not found after start', async () => {
        vi.mocked(getDockerContainers).mockResolvedValue([]);
        mockContainer.start.mockResolvedValue(undefined);

        await expect(service.startContainer('abc123def456')).rejects.toThrow(
            'Container abc123def456 not found after starting'
        );
    });

    it('should throw error if container not found after stop', async () => {
        vi.mocked(getDockerContainers).mockResolvedValue([]);
        mockContainer.stop.mockResolvedValue(undefined);

        await expect(service.stopContainer('abc123def456')).rejects.toThrow(
            'Container abc123def456 not found after stopping'
        );
    });
});
