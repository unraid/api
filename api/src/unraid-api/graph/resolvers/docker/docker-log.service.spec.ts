import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@app/core/errors/app-error.js';
import { DockerLogService } from '@app/unraid-api/graph/resolvers/docker/docker-log.service.js';

// Mock dependencies
const mockExeca = vi.fn();
vi.mock('execa', () => ({
    execa: (cmd: string, args: string[]) => mockExeca(cmd, args),
}));

const { mockDockerInstance, mockGetContainer, mockContainer } = vi.hoisted(() => {
    const mockContainer = {
        inspect: vi.fn(),
    };
    const mockGetContainer = vi.fn().mockReturnValue(mockContainer);
    const mockDockerInstance = {
        getContainer: mockGetContainer,
    };
    return { mockDockerInstance, mockGetContainer, mockContainer };
});

vi.mock('@app/unraid-api/graph/resolvers/docker/utils/docker-client.js', () => ({
    getDockerClient: vi.fn().mockReturnValue(mockDockerInstance),
}));

const { statMock } = vi.hoisted(() => ({
    statMock: vi.fn().mockResolvedValue({ size: 0 }),
}));

vi.mock('fs/promises', () => ({
    stat: statMock,
}));

describe('DockerLogService', () => {
    let service: DockerLogService;

    beforeEach(async () => {
        mockExeca.mockReset();
        mockGetContainer.mockReset();
        mockGetContainer.mockReturnValue(mockContainer);
        mockContainer.inspect.mockReset();
        statMock.mockReset();
        statMock.mockResolvedValue({ size: 0 });

        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerLogService],
        }).compile();

        service = module.get<DockerLogService>(DockerLogService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getContainerLogSizes', () => {
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

        it('should return 0 for missing log path', async () => {
            mockContainer.inspect.mockResolvedValue({}); // No LogPath

            const sizes = await service.getContainerLogSizes(['test-container']);
            expect(sizes.get('test-container')).toBe(0);
        });

        it('should handle inspect errors gracefully', async () => {
            mockContainer.inspect.mockRejectedValue(new Error('Inspect failed'));

            const sizes = await service.getContainerLogSizes(['test-container']);
            expect(sizes.get('test-container')).toBe(0);
        });
    });

    describe('getContainerLogs', () => {
        it('should fetch logs via docker CLI', async () => {
            mockExeca.mockResolvedValue({ stdout: '2023-01-01T00:00:00Z Log message\n' });

            const result = await service.getContainerLogs('test-id');

            expect(mockExeca).toHaveBeenCalledWith('docker', [
                'logs',
                '--timestamps',
                '--tail',
                '200',
                'test-id',
            ]);
            expect(result.lines).toHaveLength(1);
            expect(result.lines[0].message).toBe('Log message');
        });

        it('should respect tail option', async () => {
            mockExeca.mockResolvedValue({ stdout: '' });

            await service.getContainerLogs('test-id', { tail: 50 });

            expect(mockExeca).toHaveBeenCalledWith('docker', [
                'logs',
                '--timestamps',
                '--tail',
                '50',
                'test-id',
            ]);
        });

        it('should respect since option', async () => {
            mockExeca.mockResolvedValue({ stdout: '' });
            const since = new Date('2023-01-01T00:00:00Z');

            await service.getContainerLogs('test-id', { since });

            expect(mockExeca).toHaveBeenCalledWith('docker', [
                'logs',
                '--timestamps',
                '--tail',
                '200',
                '--since',
                since.toISOString(),
                'test-id',
            ]);
        });

        it('should throw AppError on execa failure', async () => {
            mockExeca.mockRejectedValue(new Error('Docker error'));

            await expect(service.getContainerLogs('test-id')).rejects.toThrow(AppError);
        });
    });
});
