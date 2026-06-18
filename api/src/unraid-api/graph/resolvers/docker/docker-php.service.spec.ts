import { readFile } from 'fs/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

const mockReadFile = vi.mocked(readFile);

const writeCache = (data: unknown) => mockReadFile.mockResolvedValue(JSON.stringify(data) as never);

describe('DockerPhpService.readCachedUpdateStatus', () => {
    let service: DockerPhpService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DockerPhpService();
    });

    it('keeps valid entries even when a sibling entry is malformed', async () => {
        // The webgui writes null digests / status:'undef' for stopped or locally-built
        // containers. Such an entry must not discard the valid ones (regression: U8-147).
        writeCache({
            'netdata/netdata:latest': {
                local: 'sha256:aaa',
                remote: 'sha256:bbb',
                status: 'false',
            },
            'my/localbuilt:latest': { local: null, remote: 'undef', status: 'undef' },
        });

        const result = await service.readCachedUpdateStatus();

        expect(result['netdata/netdata:latest']).toEqual({
            local: 'sha256:aaa',
            remote: 'sha256:bbb',
            status: 'false',
        });
        expect(result['my/localbuilt:latest']).toEqual({
            local: null,
            remote: 'undef',
            status: 'undef',
        });
    });

    it('drops entries with the wrong shape without failing the whole file', async () => {
        writeCache({
            'good/image:latest': { local: 'sha256:aaa', remote: 'sha256:bbb', status: 'false' },
            'bad/image:latest': { local: 123, remote: ['nope'] },
        });

        const result = await service.readCachedUpdateStatus();

        expect(Object.keys(result)).toEqual(['good/image:latest']);
    });

    it('returns an empty object when the file is missing', async () => {
        mockReadFile.mockRejectedValue(new Error('ENOENT'));
        await expect(service.readCachedUpdateStatus()).resolves.toEqual({});
    });
});

describe('DockerManifestService.isUpdateAvailableCached', () => {
    let manifest: DockerManifestService;
    let php: DockerPhpService;

    beforeEach(() => {
        vi.clearAllMocks();
        php = new DockerPhpService();
        manifest = new DockerManifestService(php);
    });

    it('reports an available update for a container whose cache survives a malformed sibling', async () => {
        writeCache({
            'netdata/netdata:latest': {
                local: 'sha256:aaa',
                remote: 'sha256:bbb',
                status: 'false',
            },
            'my/localbuilt:latest': { local: null, remote: 'undef', status: 'undef' },
        });

        await expect(manifest.isUpdateAvailableCached('netdata/netdata')).resolves.toBe(true);
    });

    it('returns null (unknown) for an undef entry instead of poisoning others', async () => {
        writeCache({
            'my/localbuilt:latest': { local: null, remote: 'undef', status: 'undef' },
        });

        await expect(manifest.isUpdateAvailableCached('my/localbuilt')).resolves.toBeNull();
    });

    it('returns false when local and remote digests match', async () => {
        writeCache({
            'foo/bar:latest': { local: 'sha256:same', remote: 'sha256:same', status: 'true' },
        });

        await expect(manifest.isUpdateAvailableCached('foo/bar')).resolves.toBe(false);
    });
});
