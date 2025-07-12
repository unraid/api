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
import { FormatService } from '@app/unraid-api/utils/format.service.js';

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
    let mockFormatService: FormatService;
    let mockCacheManager: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        const { default: got } = await import('got');
        const { execa } = await import('execa');
        const pRetry = await import('p-retry');
        const { existsSync } = await import('node:fs');

        mockGot = vi.mocked(got);
        mockExeca = vi.mocked(execa);
        mockPRetry = vi.mocked(pRetry.default);
        mockExistsSync = vi.mocked(existsSync);

        mockGot.post = vi.fn().mockImplementation((url: string) => {
            // Mock the core/pid call to indicate socket is running
            if (url.includes('core/pid')) {
                return Promise.resolve({ body: { pid: 12345 } });
            }
            return Promise.resolve({ body: {} });
        });
        // Mock execa to return a resolved promise for rclone version check
        mockExeca.mockImplementation((cmd: string, args: string[]) => {
            if (cmd === 'rclone' && args[0] === 'version') {
                return Promise.resolve({ stdout: 'rclone v1.67.0', stderr: '', exitCode: 0 } as any);
            }
            return {
                on: vi.fn(),
                kill: vi.fn(),
                killed: false,
                pid: 12345,
            } as any;
        });
        mockPRetry.mockResolvedValue(undefined);
        // Mock socket exists
        mockExistsSync.mockReturnValue(true);

        mockFormatService = {
            formatBytes: vi.fn(),
            formatDuration: vi.fn(),
        } as any;

        // Mock RCloneStatusService
        const mockStatusService = {
            enhanceStatsWithFormattedFields: vi.fn(),
            transformStatsToJob: vi.fn(),
            calculateCombinedStats: vi.fn(),
            parseActiveJobs: vi.fn(),
            parseBackupStatus: vi.fn(),
            parseJobWithStats: vi.fn(),
            parseAllJobsWithStats: vi.fn(),
            parseJobsWithStats: vi.fn(),
            getBackupStatus: vi.fn(),
        } as any;

        // Mock StreamingJobManager
        const mockStreamingJobManager = {
            startJob: vi.fn(),
            stopJob: vi.fn(),
            getJobStatus: vi.fn(),
            getAllJobs: vi.fn(),
        } as any;

        // Mock cache manager
        mockCacheManager = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
            del: vi.fn().mockResolvedValue(undefined),
        };

        service = new RCloneApiService(mockStatusService);
        // Mock the service as initialized without actually running onModuleInit
        // to avoid the initialization API calls
        (service as any).initialized = true;
        (service as any).rcloneBaseUrl = 'http://unix:/tmp/rclone.sock:';
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
                'http://unix:/tmp/rclone.sock:/config/providers',
                expect.objectContaining({
                    json: {},
                    responseType: 'json',
                    enableUnixSockets: true,
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
                'http://unix:/tmp/rclone.sock:/config/listremotes',
                expect.objectContaining({
                    json: {},
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
                'http://unix:/tmp/rclone.sock:/config/get',
                expect.objectContaining({
                    json: { name: 'test-remote' },
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
                'http://unix:/tmp/rclone.sock:/config/create',
                expect.objectContaining({
                    json: {
                        name: 'new-remote',
                        type: 's3',
                        parameters: { access_key_id: 'AKIA...', secret_access_key: 'secret' },
                    },
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
                'http://unix:/tmp/rclone.sock:/config/update',
                expect.objectContaining({
                    json: {
                        name: 'existing-remote',
                        access_key_id: 'NEW_AKIA...',
                    },
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
                'http://unix:/tmp/rclone.sock:/config/delete',
                expect.objectContaining({
                    json: { name: 'remote-to-delete' },
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

            // Clear previous mock calls and set up fresh mock
            mockGot.post.mockClear();
            mockGot.post.mockResolvedValue({ body: mockResponse });

            const result = await service.startBackup(input);

            expect(result).toEqual(mockResponse);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:/sync/copy',
                expect.objectContaining({
                    json: expect.objectContaining({
                        srcFs: '/source/path',
                        dstFs: 'remote:backup/path',
                        delete_on: 'dst',
                    }),
                })
            );
        });
    });

    describe('getJobStatus', () => {
        it('should return job status', async () => {
            const input: GetRCloneJobStatusDto = { jobId: 'job-123' };
            const mockStatus = { id: 'job-123', status: 'running', progress: 0.5 };
            mockGot.post.mockImplementation((url: string) => {
                if (url.includes('core/stats')) {
                    return Promise.resolve({ body: {} });
                }
                if (url.includes('job/status')) {
                    return Promise.resolve({ body: mockStatus });
                }
                return Promise.resolve({ body: {} });
            });

            // Mock the status service methods
            const mockStatusService = (service as any).statusService;
            mockStatusService.enhanceStatsWithFormattedFields = vi.fn().mockReturnValue({});
            mockStatusService.transformStatsToJob = vi.fn().mockReturnValue(null);
            mockStatusService.parseJobWithStats = vi.fn().mockReturnValue(mockStatus);

            const result = await service.getJobStatus(input);

            expect(result).toEqual(mockStatus);
            expect(mockGot.post).toHaveBeenCalledWith(
                'http://unix:/tmp/rclone.sock:/job/status',
                expect.objectContaining({
                    json: { jobid: 'job-123' },
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
                'http://unix:/tmp/rclone.sock:/job/list',
                expect.objectContaining({
                    json: {},
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
                'Rclone API Error (config/providers, HTTP 404): Failed to process error response: '
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
                'Rclone API Error (config/providers, HTTP 400): Failed to process error response: invalid json'
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
                'Unknown error calling RClone API (config/providers): unknown error'
            );
        });
    });
});
