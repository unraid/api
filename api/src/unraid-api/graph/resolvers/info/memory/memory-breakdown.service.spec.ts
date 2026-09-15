import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryBreakdownService } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';

const { readFileMock, execaMock, listContainersMock } = vi.hoisted(() => ({
    readFileMock: vi.fn(),
    execaMock: vi.fn(),
    listContainersMock: vi.fn(),
}));

vi.mock('fs/promises', () => ({
    readFile: readFileMock,
}));

vi.mock('execa', () => ({
    execa: execaMock,
}));

vi.mock('@app/unraid-api/graph/resolvers/docker/utils/docker-client.js', () => ({
    getDockerClient: () => ({ listContainers: listContainersMock }),
}));

describe('MemoryBreakdownService', () => {
    let service: MemoryBreakdownService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new MemoryBreakdownService();
    });

    describe('getZfsCache', () => {
        it('returns the ARC size in bytes', async () => {
            readFileMock.mockResolvedValue('name type data\nhits 4 100\nsize 4 1503238553\n');
            await expect(service.getZfsCache()).resolves.toBe(1503238553);
        });

        it('returns null when the arcstats file is missing', async () => {
            readFileMock.mockRejectedValue(new Error('ENOENT'));
            await expect(service.getZfsCache()).resolves.toBeNull();
        });
    });

    describe('getVmMemory', () => {
        it('sums balloon.rss across domains and converts KiB to bytes', async () => {
            execaMock.mockResolvedValue({
                stdout: [
                    'Domain: vm1',
                    '  balloon.rss=4194304',
                    'Domain: vm2',
                    '  balloon.rss=2097152',
                ].join('\n'),
            });
            await expect(service.getVmMemory()).resolves.toBe((4194304 + 2097152) * 1024);
        });

        it('returns null when virsh is unavailable', async () => {
            execaMock.mockRejectedValue(new Error('not found'));
            await expect(service.getVmMemory()).resolves.toBeNull();
        });
    });

    describe('getDockerMemory', () => {
        it('sums the relevant memory.stat fields across running containers', async () => {
            listContainersMock.mockResolvedValue([{ Id: 'abc' }, { Id: 'def' }]);
            readFileMock.mockResolvedValue(
                ['anon 1000', 'file 9999', 'kernel 500', 'shmem 250', 'sock 50'].join('\n')
            );
            await expect(service.getDockerMemory()).resolves.toBe(1800 * 2);
        });

        it('returns 0 when no containers are running', async () => {
            listContainersMock.mockResolvedValue([]);
            await expect(service.getDockerMemory()).resolves.toBe(0);
        });

        it('returns null when the docker socket is unavailable', async () => {
            listContainersMock.mockRejectedValue(new Error('ECONNREFUSED'));
            await expect(service.getDockerMemory()).resolves.toBeNull();
        });
    });

    describe('getSources caching', () => {
        it('collects each source once within the cache window', async () => {
            readFileMock.mockResolvedValue('size 4 100\n');
            execaMock.mockResolvedValue({ stdout: 'balloon.rss=1024' });
            listContainersMock.mockResolvedValue([]);

            await service.getSources();
            await service.getSources();

            expect(execaMock).toHaveBeenCalledTimes(1);
            expect(listContainersMock).toHaveBeenCalledTimes(1);
        });

        it('reuses a single in-flight collection for concurrent callers', async () => {
            readFileMock.mockResolvedValue('size 4 100\n');
            execaMock.mockResolvedValue({ stdout: '' });
            let resolveContainers: (value: unknown[]) => void = () => {};
            listContainersMock.mockReturnValue(
                new Promise((resolve) => {
                    resolveContainers = resolve;
                })
            );

            const first = service.getSources();
            const second = service.getSources();
            resolveContainers([]);
            await Promise.all([first, second]);

            expect(listContainersMock).toHaveBeenCalledTimes(1);
        });
    });
});
