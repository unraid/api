import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RCloneStatusService } from '@app/unraid-api/graph/resolvers/rclone/rclone-status.service.js';
import { RCloneJobStats } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { FormatService } from '@app/unraid-api/utils/format.service.js';

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

describe('RCloneStatusService', () => {
    let service: RCloneStatusService;
    let mockFormatService: FormatService;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFormatService = {
            formatBytes: vi.fn().mockImplementation((bytes: number) => `${bytes} B`),
            formatSpeed: vi.fn().mockImplementation((bytesPerSecond: number) => `${bytesPerSecond} B/s`),
            formatDuration: vi.fn().mockImplementation((seconds: number) => `${seconds}s`),
        } as any;

        service = new RCloneStatusService(mockFormatService);
    });

    describe('enhanceStatsWithFormattedFields', () => {
        it('should add formatted fields for all numeric stats', () => {
            const stats: RCloneJobStats = {
                bytes: 1024,
                speed: 512,
                elapsedTime: 60,
                eta: 120,
            };

            const result = service.enhanceStatsWithFormattedFields(stats);

            expect(result).toEqual({
                bytes: 1024,
                speed: 512,
                elapsedTime: 60,
                eta: 120,
                formattedBytes: '1024 B',
                formattedSpeed: '512 B/s',
                formattedElapsedTime: '60s',
                formattedEta: '120s',
            });
            expect(mockFormatService.formatBytes).toHaveBeenCalledWith(1024);
            expect(mockFormatService.formatSpeed).toHaveBeenCalledWith(512);
            expect(mockFormatService.formatDuration).toHaveBeenCalledWith(60);
            expect(mockFormatService.formatDuration).toHaveBeenCalledWith(120);
        });

        it('should not add formatted fields for undefined values', () => {
            const stats: RCloneJobStats = {
                bytes: undefined,
                speed: undefined,
                elapsedTime: undefined,
                eta: undefined,
            };

            const result = service.enhanceStatsWithFormattedFields(stats);

            expect(result).toEqual(stats);
            expect(mockFormatService.formatBytes).not.toHaveBeenCalled();
            expect(mockFormatService.formatDuration).not.toHaveBeenCalled();
        });

        it('should not add formatted fields for null values', () => {
            const stats: RCloneJobStats = {
                bytes: null as any,
                speed: null as any,
                elapsedTime: null as any,
                eta: null as any,
            };

            const result = service.enhanceStatsWithFormattedFields(stats);

            expect(result).toEqual(stats);
            expect(mockFormatService.formatBytes).not.toHaveBeenCalled();
            expect(mockFormatService.formatDuration).not.toHaveBeenCalled();
        });

        it('should not add formatted speed for zero speed', () => {
            const stats: RCloneJobStats = {
                speed: 0,
            };

            const result = service.enhanceStatsWithFormattedFields(stats);

            expect(result).toEqual({ speed: 0 });
            expect(mockFormatService.formatSpeed).not.toHaveBeenCalled();
        });

        it('should not add formatted eta for zero eta', () => {
            const stats: RCloneJobStats = {
                eta: 0,
            };

            const result = service.enhanceStatsWithFormattedFields(stats);

            expect(result).toEqual({ eta: 0 });
            expect(mockFormatService.formatDuration).not.toHaveBeenCalled();
        });
    });

    describe('transformStatsToJob', () => {
        it('should create RCloneJob with completed status when transfers match total', () => {
            const stats: RCloneJobStats = {
                group: 'unraid-backup',
                fatalError: false,
                transfers: 5,
                totalTransfers: 5,
                errors: 0,
                percentage: 100,
            };

            const result = service.transformStatsToJob('123', stats);

            expect(result).toEqual({
                id: '123',
                group: 'unraid-backup',
                stats,
                finished: true,
                success: true,
                error: undefined,
                progressPercentage: 100,
                detailedStatus: 'Completed',
            });
        });

        it('should create RCloneJob with running status when transfers incomplete', () => {
            const stats: RCloneJobStats = {
                group: 'unraid-backup',
                fatalError: false,
                transfers: 3,
                totalTransfers: 5,
                errors: 0,
                percentage: 60,
            };

            const result = service.transformStatsToJob('123', stats);

            expect(result).toEqual({
                id: '123',
                group: 'unraid-backup',
                stats,
                finished: false,
                success: true,
                error: undefined,
                progressPercentage: 60,
                detailedStatus: 'Running',
            });
        });

        it('should create RCloneJob with error status when lastError exists', () => {
            const stats: RCloneJobStats = {
                group: 'unraid-backup',
                fatalError: false,
                transfers: 0,
                totalTransfers: 5,
                errors: 1,
                percentage: 0,
                lastError: 'Connection timeout',
            };

            const result = service.transformStatsToJob('123', stats);

            expect(result).toEqual({
                id: '123',
                group: 'unraid-backup',
                stats,
                finished: false,
                success: false,
                error: 'Connection timeout',
                progressPercentage: 0,
                detailedStatus: 'Error',
            });
        });

        it('should handle numeric job ID', () => {
            const stats: RCloneJobStats = {
                fatalError: false,
                transfers: 0,
                totalTransfers: 0,
            };

            const result = service.transformStatsToJob(456, stats);

            expect(result.id).toBe('456');
        });

        it('should handle missing group', () => {
            const stats: RCloneJobStats = {
                fatalError: false,
                transfers: 0,
                totalTransfers: 0,
            };

            const result = service.transformStatsToJob('123', stats);

            expect(result.group).toBeUndefined();
        });
    });

    describe('calculateCombinedStats', () => {
        it('should combine stats from multiple jobs', () => {
            const mockActiveJobs = [
                {
                    stats: {
                        bytes: 1024,
                        checks: 2,
                        transfers: 3,
                        totalBytes: 2048,
                        totalChecks: 4,
                        totalTransfers: 6,
                        speed: 100,
                        eta: 120,
                    },
                },
                {
                    stats: {
                        bytes: 512,
                        checks: 1,
                        transfers: 2,
                        totalBytes: 1024,
                        totalChecks: 2,
                        totalTransfers: 4,
                        speed: 200,
                        eta: 60,
                    },
                },
            ];

            const result = service.calculateCombinedStats(mockActiveJobs);

            expect(result).toEqual({
                bytes: 1536,
                checks: 3,
                transfers: 5,
                totalBytes: 3072,
                totalChecks: 6,
                totalTransfers: 10,
                speed: 200, // Max speed
                eta: 120, // Max eta
            });
        });

        it('should return null for empty jobs array', () => {
            const result = service.calculateCombinedStats([]);
            expect(result).toBeNull();
        });

        it('should return null when no valid stats', () => {
            const mockActiveJobs = [{ stats: null as any }, { stats: undefined as any }];
            const result = service.calculateCombinedStats(mockActiveJobs);
            expect(result).toBeNull();
        });
    });

    describe('parseActiveJobs', () => {
        it('should return active jobs that are not finished', () => {
            const mockJobStatuses = [
                { status: 'fulfilled', value: { id: '1', finished: false } },
                { status: 'fulfilled', value: { id: '2', finished: true } },
                { status: 'rejected', reason: 'Error' },
            ] as PromiseSettledResult<any>[];

            const result = service.parseActiveJobs(mockJobStatuses);

            expect(result).toEqual([{ id: '1', finished: false }]);
        });

        it('should return empty array when all jobs are finished', () => {
            const mockJobStatuses = [
                { status: 'fulfilled', value: { id: '1', finished: true } },
            ] as PromiseSettledResult<any>[];

            const result = service.parseActiveJobs(mockJobStatuses);

            expect(result).toEqual([]);
        });
    });

    describe('parseBackupStatus', () => {
        it('should return running status when active jobs exist', () => {
            const mockRunningJobs = { jobids: ['123', '456'] };
            const mockJobStatuses = [
                { status: 'fulfilled', value: { id: '123', finished: false, stats: { bytes: 1024 } } },
                { status: 'fulfilled', value: { id: '456', finished: false, stats: { bytes: 512 } } },
            ] as PromiseSettledResult<any>[];

            const result = service.parseBackupStatus(mockRunningJobs, mockJobStatuses);

            expect(result).toEqual({
                isRunning: true,
                stats: expect.objectContaining({ bytes: 1536 }),
                jobCount: 2,
                activeJobs: expect.arrayContaining([
                    expect.objectContaining({ id: '123', finished: false }),
                    expect.objectContaining({ id: '456', finished: false }),
                ]),
            });
        });

        it('should return not running when no job IDs', () => {
            const mockRunningJobs = { jobids: [] };
            const mockJobStatuses = [] as PromiseSettledResult<any>[];

            const result = service.parseBackupStatus(mockRunningJobs, mockJobStatuses);

            expect(result).toEqual({
                isRunning: false,
                stats: null,
                jobCount: 0,
                activeJobs: [],
            });
        });
    });

    describe('parseJobWithStats', () => {
        it('should parse job with enhanced stats', () => {
            const mockJobStatus = {
                stats: { bytes: 1024, speed: 512 },
            };

            const result = service.parseJobWithStats('123', mockJobStatus);

            expect(result).toEqual(
                expect.objectContaining({
                    id: '123',
                    stats: expect.objectContaining({
                        bytes: 1024,
                        speed: 512,
                        formattedBytes: '1024 B',
                        formattedSpeed: '512 B/s',
                    }),
                })
            );
        });

        it('should handle missing stats', () => {
            const mockJobStatus = {};

            const result = service.parseJobWithStats('123', mockJobStatus);

            expect(result.id).toBe('123');
            expect(result.stats).toEqual({});
        });
    });

    describe('parseAllJobsWithStats', () => {
        it('should return jobs when job IDs exist', () => {
            const mockRunningJobs = { jobids: ['123', '456'] };
            const mockJobs = [
                { id: '123', group: 'unraid-backup' },
                { id: '456', group: 'unraid-backup' },
            ] as any[];

            const result = service.parseAllJobsWithStats(mockRunningJobs, mockJobs);

            expect(result).toEqual(mockJobs);
        });

        it('should return empty array when no job IDs', () => {
            const mockRunningJobs = { jobids: [] };
            const mockJobs = [] as any[];

            const result = service.parseAllJobsWithStats(mockRunningJobs, mockJobs);

            expect(result).toEqual([]);
        });
    });

    describe('parseJobsWithStats', () => {
        it('should parse fulfilled job statuses', () => {
            const mockJobStatuses = [
                { status: 'fulfilled', value: { id: '123', stats: { bytes: 1024 } } },
                { status: 'fulfilled', value: { id: '456', stats: { bytes: 512 } } },
                { status: 'rejected', reason: 'Error' },
            ] as PromiseSettledResult<any>[];

            const result = service.parseJobsWithStats(mockJobStatuses);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    id: '123',
                    stats: expect.objectContaining({ bytes: 1024, formattedBytes: '1024 B' }),
                })
            );
            expect(result[1]).toEqual(
                expect.objectContaining({
                    id: '456',
                    stats: expect.objectContaining({ bytes: 512, formattedBytes: '512 B' }),
                })
            );
        });

        it('should handle rejected statuses gracefully', () => {
            const mockJobStatuses = [
                { status: 'rejected', reason: 'Error' },
            ] as PromiseSettledResult<any>[];

            const result = service.parseJobsWithStats(mockJobStatuses);

            expect(result).toEqual([]);
        });
    });

    describe('getBackupStatus', () => {
        it('should return default backup status', () => {
            const result = service.getBackupStatus();

            expect(result).toEqual({
                isRunning: false,
                stats: null,
                jobCount: 0,
            });
        });
    });
});
