import { HTTPError } from 'got';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import {
    CreateRCloneRemoteDto,
    DeleteRCloneRemoteDto,
    GetRCloneJobStatusDto,
    GetRCloneRemoteConfigDto,
    GetRCloneRemoteDetailsDto,
    RCloneStartBackupInput,
    UpdateRCloneRemoteDto,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';

vi.mock('got');
vi.mock('execa');
vi.mock('p-retry');
vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
    mkdir: vi.fn(),
    rm: vi.fn(),
    writeFile: vi.fn(),
}));
vi.mock('@app/core/log.js', () => ({
    sanitizeParams: vi.fn((params) => params),
}));
vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => ({
            'rclone-socket': '/tmp/rclone.sock',
            'log-base': '/var/log',
        }),
    },
}));
vi.mock('@app/environment.js', () => ({
    ENVIRONMENT: 'development',
    environment: {
        IS_MAIN_PROCESS: true,
    },
}));
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn().mockResolvedValue(true),
}));

// Mock NestJS Logger to suppress logs during tests
vi.mock('@nestjs/common', async (importOriginal) => {
    const original = await importOriginal<typeof import('@nestjs/common')>();
    return {
        ...original,
        Logger: vi.fn(() => ({
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        })),
    };
});

describe('RCloneApiService', () => {
    let service: RCloneApiService;
    let mockGot: any;
    let mockExeca: any;
    let mockPRetry: any;
    let mockExistsSync: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        const { default: got } = await import('got');
        const { execa } = await import('execa');
        const pRetry = await import('p-retry');
        const { existsSync } = await import('node:fs');
        const { fileExists } = await import('@app/core/utils/files/file-exists.js');

        mockGot = vi.mocked(got);
        mockExeca = vi.mocked(execa);
        mockPRetry = vi.mocked(pRetry.default);
        mockExistsSync = vi.mocked(existsSync);

        // Mock successful RClone API response for socket check
        mockGot.post = vi.fn().mockResolvedValue({ body: { pid: 12345 } });

        // Mock RClone binary exists check
        vi.mocked(fileExists).mockResolvedValue(true);

        // Mock socket exists
        mockExistsSync.mockReturnValue(true);

        mockExeca.mockReturnValue({
            on: vi.fn(),
            kill: vi.fn(),
            killed: false,
            pid: 12345,
        } as any);
        mockPRetry.mockResolvedValue(undefined);

        service = new RCloneApiService();
        await service.onModuleInit();

        // Reset the mock after initialization to prepare for test-specific responses
        mockGot.post.mockClear();
    });

    describe('getProviders', () => {
        it('should return list of providers', async () => {
            const mockProviders = [
                { name: 'aws', prefix: 's3', description: 'Amazon S3' },
                { name: 'google', prefix: 'drive', description: 'Google Drive' },
            ];
            mockGot.post.mockResolvedValue({
                body: { providers: mockProviders },
            });

            const result = await service.getProviders();

            expect(result).toEqual(mockProviders);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/providers',
                expect.objectContaining({
                    json: {},
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });

        it('should return empty array when no providers', async () => {
            mockGot.post.mockResolvedValue({ body: {} });

            const result = await service.getProviders();

            expect(result).toEqual([]);
        });
    });

    describe('listRemotes', () => {
        it('should return list of remotes', async () => {
            const mockRemotes = ['backup-s3', 'drive-storage'];
            mockGot.post.mockResolvedValue({
                body: { remotes: mockRemotes },
            });

            const result = await service.listRemotes();

            expect(result).toEqual(mockRemotes);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/listremotes',
                expect.objectContaining({
                    json: {},
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });

        it('should return empty array when no remotes', async () => {
            mockGot.post.mockResolvedValue({ body: {} });

            const result = await service.listRemotes();

            expect(result).toEqual([]);
        });
    });

    describe('getRemoteDetails', () => {
        it('should return remote details', async () => {
            const input: GetRCloneRemoteDetailsDto = { name: 'test-remote' };
            const mockConfig = { type: 's3', provider: 'AWS' };
            mockGot.post.mockResolvedValue({ body: mockConfig });

            const result = await service.getRemoteDetails(input);

            expect(result).toEqual(mockConfig);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/get',
                expect.objectContaining({
                    json: { name: 'test-remote' },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('getRemoteConfig', () => {
        it('should return remote configuration', async () => {
            const input: GetRCloneRemoteConfigDto = { name: 'test-remote' };
            const mockConfig = { type: 's3', access_key_id: 'AKIA...' };
            mockGot.post.mockResolvedValue({ body: mockConfig });

            const result = await service.getRemoteConfig(input);

            expect(result).toEqual(mockConfig);
        });
    });

    describe('createRemote', () => {
        it('should create a new remote', async () => {
            const input: CreateRCloneRemoteDto = {
                name: 'new-remote',
                type: 's3',
                parameters: { access_key_id: 'AKIA...', secret_access_key: 'secret' },
            };
            const mockResponse = { success: true };
            mockGot.post.mockResolvedValue({ body: mockResponse });

            const result = await service.createRemote(input);

            expect(result).toEqual(mockResponse);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/create',
                expect.objectContaining({
                    json: {
                        name: 'new-remote',
                        type: 's3',
                        parameters: { access_key_id: 'AKIA...', secret_access_key: 'secret' },
                    },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('updateRemote', () => {
        it('should update an existing remote', async () => {
            const input: UpdateRCloneRemoteDto = {
                name: 'existing-remote',
                parameters: { access_key_id: 'NEW_AKIA...' },
            };
            const mockResponse = { success: true };
            mockGot.post.mockResolvedValue({ body: mockResponse });

            const result = await service.updateRemote(input);

            expect(result).toEqual(mockResponse);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/update',
                expect.objectContaining({
                    json: {
                        name: 'existing-remote',
                        access_key_id: 'NEW_AKIA...',
                    },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('deleteRemote', () => {
        it('should delete a remote', async () => {
            const input: DeleteRCloneRemoteDto = { name: 'remote-to-delete' };
            const mockResponse = { success: true };
            mockGot.post.mockResolvedValue({ body: mockResponse });

            const result = await service.deleteRemote(input);

            expect(result).toEqual(mockResponse);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:config/delete',
                expect.objectContaining({
                    json: { name: 'remote-to-delete' },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('startBackup', () => {
        it('should start a backup operation', async () => {
            const input: RCloneStartBackupInput = {
                srcPath: '/source/path',
                dstPath: 'remote:backup/path',
                options: { delete_on: 'dst' },
            };
            const mockResponse = { jobid: 'job-123' };
            mockGot.post.mockResolvedValue({ body: mockResponse });

            const result = await service.startBackup(input);

            expect(result).toEqual(mockResponse);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:sync/copy',
                expect.objectContaining({
                    json: {
                        srcFs: '/source/path',
                        dstFs: 'remote:backup/path',
                        delete_on: 'dst',
                    },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('getJobStatus', () => {
        it('should return job status', async () => {
            const input: GetRCloneJobStatusDto = { jobId: 'job-123' };
            const mockStatus = { status: 'running', progress: 0.5 };
            mockGot.post.mockResolvedValue({ body: mockStatus });

            const result = await service.getJobStatus(input);

            expect(result).toEqual(mockStatus);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:job/status',
                expect.objectContaining({
                    json: { jobid: 'job-123' },
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('listRunningJobs', () => {
        it('should return list of running jobs', async () => {
            const mockJobs = [
                { id: 'job-1', status: 'running' },
                { id: 'job-2', status: 'finished' },
            ];
            mockGot.post.mockResolvedValue({ body: mockJobs });

            const result = await service.listRunningJobs();

            expect(result).toEqual(mockJobs);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:job/list',
                expect.objectContaining({
                    json: {},
                    responseType: 'json',
                    enableUnixSockets: true,
                    headers: expect.objectContaining({
                        Authorization: expect.stringMatching(/^Basic /),
                    }),
                })
            );
        });
    });

    describe('error handling', () => {
        it('should handle HTTP errors with detailed messages', async () => {
            const httpError = {
                name: 'HTTPError',
                message: 'Request failed',
                response: {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Internal server error' }),
                },
            };
            Object.setPrototypeOf(httpError, HTTPError.prototype);
            mockGot.post.mockRejectedValue(httpError);

            await expect(service.getProviders()).rejects.toThrow(
                'Rclone API Error (config/providers, HTTP 500): Rclone Error: Internal server error'
            );
        });

        it('should handle HTTP errors with empty response body', async () => {
            const httpError = {
                name: 'HTTPError',
                message: 'Request failed',
                response: {
                    statusCode: 404,
                    body: '',
                },
            };
            Object.setPrototypeOf(httpError, HTTPError.prototype);
            mockGot.post.mockRejectedValue(httpError);

            await expect(service.getProviders()).rejects.toThrow(
                'Rclone API Error (config/providers, HTTP 404): Failed to process error response body. Raw body:'
            );
        });

        it('should handle HTTP errors with malformed JSON', async () => {
            const httpError = {
                name: 'HTTPError',
                message: 'Request failed',
                response: {
                    statusCode: 400,
                    body: 'invalid json',
                },
            };
            Object.setPrototypeOf(httpError, HTTPError.prototype);
            mockGot.post.mockRejectedValue(httpError);

            await expect(service.getProviders()).rejects.toThrow(
                'Rclone API Error (config/providers, HTTP 400): Failed to process error response body. Raw body: invalid json'
            );
        });

        it('should handle non-HTTP errors', async () => {
            const networkError = new Error('Network connection failed');
            mockGot.post.mockRejectedValue(networkError);

            await expect(service.getProviders()).rejects.toThrow('Network connection failed');
        });

        it('should handle unknown errors', async () => {
            mockGot.post.mockRejectedValue('unknown error');

            await expect(service.getProviders()).rejects.toThrow(
                'Unknown error calling RClone API (config/providers) with params {}: unknown error'
            );
        });
    });
});
