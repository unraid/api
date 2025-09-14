import { Test, TestingModule } from '@nestjs/testing';
import type { ReadStream, Stats } from 'node:fs';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { execa, ExecaError } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiReportData } from '@app/unraid-api/cli/api-report.service.js';
import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';
import { getters } from '@app/store/index.js';
import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('execa');
vi.mock('@app/store/index.js');
vi.mock('@app/core/utils/images/image-file-helpers.js', () => ({
    getBannerPathIfPresent: vi.fn(),
    getCasePathIfPresent: vi.fn(),
}));

describe('RestService', () => {
    let service: RestService;
    let apiReportService: ApiReportService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RestService,
                {
                    provide: ApiReportService,
                    useValue: {
                        generateReport: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RestService>(RestService);
        apiReportService = module.get<ApiReportService>(ApiReportService);
    });

    describe('getLogs', () => {
        const mockLogPath = '/usr/local/emhttp/logs/unraid-api';
        const mockGraphqlApiLog = '/var/log/graphql-api.log';
        const mockZipPath = '/usr/local/emhttp/logs/unraid-api.tar.gz';

        beforeEach(() => {
            vi.mocked(getters).paths = vi.fn().mockReturnValue({
                'log-base': mockLogPath,
            });
            // Mock saveApiReport to avoid side effects
            vi.spyOn(service as any, 'saveApiReport').mockResolvedValue(undefined);
        });

        it('should create and return log archive successfully', async () => {
            const mockStream: ReadStream = Readable.from([]) as ReadStream;
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath || path === mockZipPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });
            vi.mocked(execa).mockResolvedValue({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as any);
            vi.mocked(createReadStream).mockReturnValue(mockStream);

            const result = await service.getLogs();

            expect(execa).toHaveBeenCalledWith('tar', ['-czf', mockZipPath, mockLogPath], {
                timeout: 60000,
                reject: true,
            });
            expect(createReadStream).toHaveBeenCalledWith(mockZipPath);
            expect(result).toBe(mockStream);
        });

        it('should include graphql-api.log when it exists', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath || path === mockGraphqlApiLog || path === mockZipPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });
            vi.mocked(execa).mockResolvedValue({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as any);
            vi.mocked(createReadStream).mockReturnValue(Readable.from([]) as ReadStream);

            await service.getLogs();

            expect(execa).toHaveBeenCalledWith(
                'tar',
                ['-czf', mockZipPath, mockLogPath, mockGraphqlApiLog],
                {
                    timeout: 60000,
                    reject: true,
                }
            );
        });

        it('should handle timeout errors with detailed message', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });

            const timeoutError = new Error('Command timed out') as ExecaError;
            timeoutError.timedOut = true;
            timeoutError.command =
                'tar -czf /usr/local/emhttp/logs/unraid-api.tar.gz /usr/local/emhttp/logs/unraid-api';
            timeoutError.exitCode = undefined;
            timeoutError.stderr = '';
            timeoutError.stdout = '';

            vi.mocked(execa).mockRejectedValue(timeoutError);

            await expect(service.getLogs()).rejects.toThrow('Tar command timed out after 60 seconds');
        });

        it('should handle command failure with exit code and stderr', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });

            const execError = new Error('Command failed') as ExecaError;
            execError.exitCode = 1;
            execError.command =
                'tar -czf /usr/local/emhttp/logs/unraid-api.tar.gz /usr/local/emhttp/logs/unraid-api';
            execError.stderr = 'tar: Cannot create archive';
            execError.stdout = '';
            execError.shortMessage = 'Command failed with exit code 1';

            vi.mocked(execa).mockRejectedValue(execError);

            await expect(service.getLogs()).rejects.toThrow('Tar command failed with exit code 1');
            await expect(service.getLogs()).rejects.toThrow('tar: Cannot create archive');
        });

        it('should handle case when tar succeeds but zip file is not created', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                // Zip file doesn't exist after tar command
                return Promise.reject(new Error('File not found'));
            });
            vi.mocked(execa).mockResolvedValue({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as any);

            await expect(service.getLogs()).rejects.toThrow(
                'Failed to create log zip - tar file not found after successful command'
            );
        });

        it('should throw error when log path does not exist', async () => {
            vi.mocked(stat).mockRejectedValue(new Error('File not found'));

            await expect(service.getLogs()).rejects.toThrow('No logs to download');
        });

        it('should handle generic errors', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });

            const genericError = new Error('Unexpected error');
            vi.mocked(execa).mockRejectedValue(genericError);

            await expect(service.getLogs()).rejects.toThrow(
                'Failed to create logs archive: Unexpected error'
            );
        });

        it('should handle errors with stdout in addition to stderr', async () => {
            vi.mocked(stat).mockImplementation((path) => {
                if (path === mockLogPath) {
                    return Promise.resolve({ isFile: () => true } as unknown as Stats);
                }
                return Promise.reject(new Error('File not found'));
            });

            const execError = new Error('Command failed') as ExecaError;
            execError.exitCode = 1;
            execError.command =
                'tar -czf /usr/local/emhttp/logs/unraid-api.tar.gz /usr/local/emhttp/logs/unraid-api';
            execError.stderr = 'tar: Error';
            execError.stdout = 'Processing archive...';
            execError.shortMessage = 'Command failed with exit code 1';

            vi.mocked(execa).mockRejectedValue(execError);

            await expect(service.getLogs()).rejects.toThrow('Stdout: Processing archive');
        });
    });

    describe('saveApiReport', () => {
        it('should generate and save API report', async () => {
            const mockReport: ApiReportData = {
                timestamp: new Date().toISOString(),
                connectionStatus: { running: 'yes' },
                system: {
                    name: 'Test Server',
                    version: '6.12.0',
                    machineId: 'test-machine-id',
                },
                connect: {
                    installed: false,
                },
                config: {
                    valid: true,
                },
                services: {
                    cloud: null,
                    minigraph: null,
                    allServices: [],
                },
            };
            const mockPath = '/test/report.json';

            vi.mocked(apiReportService.generateReport).mockResolvedValue(mockReport);
            vi.mocked(writeFile).mockResolvedValue(undefined);

            await service.saveApiReport(mockPath);

            expect(apiReportService.generateReport).toHaveBeenCalled();
            expect(writeFile).toHaveBeenCalledWith(
                mockPath,
                JSON.stringify(mockReport, null, 2),
                'utf-8'
            );
        });

        it('should handle errors when generating report', async () => {
            const mockPath = '/test/report.json';

            vi.mocked(apiReportService.generateReport).mockRejectedValue(
                new Error('Report generation failed')
            );

            // Should not throw, just log warning
            await expect(service.saveApiReport(mockPath)).resolves.toBeUndefined();
            expect(apiReportService.generateReport).toHaveBeenCalled();
        });
    });

    describe('getCustomizationPath', () => {
        it('should return banner path when type is banner', async () => {
            const mockBannerPath = '/path/to/banner.png';
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(mockBannerPath);

            const result = await service.getCustomizationPath('banner');

            expect(getBannerPathIfPresent).toHaveBeenCalled();
            expect(result).toBe(mockBannerPath);
        });

        it('should return case path when type is case', async () => {
            const mockCasePath = '/path/to/case.png';
            vi.mocked(getCasePathIfPresent).mockResolvedValue(mockCasePath);

            const result = await service.getCustomizationPath('case');

            expect(getCasePathIfPresent).toHaveBeenCalled();
            expect(result).toBe(mockCasePath);
        });

        it('should return null when no banner found', async () => {
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(null);

            const result = await service.getCustomizationPath('banner');

            expect(result).toBeNull();
        });

        it('should return null when no case found', async () => {
            vi.mocked(getCasePathIfPresent).mockResolvedValue(null);

            const result = await service.getCustomizationPath('case');

            expect(result).toBeNull();
        });
    });

    describe('getCustomizationStream', () => {
        it('should return read stream for banner', async () => {
            const mockPath = '/path/to/banner.png';
            const mockStream: ReadStream = Readable.from([]) as ReadStream;

            vi.mocked(getBannerPathIfPresent).mockResolvedValue(mockPath);
            vi.mocked(createReadStream).mockReturnValue(mockStream);

            const result = await service.getCustomizationStream('banner');

            expect(getBannerPathIfPresent).toHaveBeenCalled();
            expect(createReadStream).toHaveBeenCalledWith(mockPath);
            expect(result).toBe(mockStream);
        });

        it('should return read stream for case', async () => {
            const mockPath = '/path/to/case.png';
            const mockStream: ReadStream = Readable.from([]) as ReadStream;

            vi.mocked(getCasePathIfPresent).mockResolvedValue(mockPath);
            vi.mocked(createReadStream).mockReturnValue(mockStream);

            const result = await service.getCustomizationStream('case');

            expect(getCasePathIfPresent).toHaveBeenCalled();
            expect(createReadStream).toHaveBeenCalledWith(mockPath);
            expect(result).toBe(mockStream);
        });

        it('should throw error when no banner found', async () => {
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(null);

            await expect(service.getCustomizationStream('banner')).rejects.toThrow('No banner found');
        });

        it('should throw error when no case found', async () => {
            vi.mocked(getCasePathIfPresent).mockResolvedValue(null);

            await expect(service.getCustomizationStream('case')).rejects.toThrow('No case found');
        });
    });
});
