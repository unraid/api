import * as fs from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

vi.mock('node:fs/promises');
vi.mock('execa');
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn().mockResolvedValue(false),
}));
vi.mock('@app/environment.js', () => ({
    PATHS_LOGS_DIR: '/var/log/unraid-api',
    PM2_HOME: '/var/log/.pm2',
    PM2_PATH: '/path/to/pm2',
    ECOSYSTEM_PATH: '/path/to/ecosystem.config.json',
    SUPPRESS_LOGS: false,
    LOG_LEVEL: 'info',
}));

describe('PM2Service', () => {
    let pm2Service: PM2Service;
    let logService: LogService;
    const mockMkdir = vi.mocked(fs.mkdir);

    beforeEach(() => {
        vi.clearAllMocks();
        logService = {
            trace: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
        } as unknown as LogService;
        pm2Service = new PM2Service(logService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('ensurePm2Dependencies', () => {
        it('should create logs directory and log that PM2 will handle its own directory', async () => {
            mockMkdir.mockResolvedValue(undefined);

            await pm2Service.ensurePm2Dependencies();

            expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
            expect(mockMkdir).toHaveBeenCalledTimes(1); // Only logs directory, not PM2_HOME
            expect(logService.trace).toHaveBeenCalledWith(
                'PM2_HOME will be created at /var/log/.pm2 when PM2 daemon starts'
            );
        });

        it('should log error but not throw when logs directory creation fails', async () => {
            mockMkdir.mockRejectedValue(new Error('Disk full'));

            await expect(pm2Service.ensurePm2Dependencies()).resolves.not.toThrow();

            expect(logService.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fully ensure PM2 dependencies: Disk full')
            );
        });

        it('should handle mkdir with recursive flag for nested logs path', async () => {
            mockMkdir.mockResolvedValue(undefined);

            await pm2Service.ensurePm2Dependencies();

            expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
            expect(mockMkdir).toHaveBeenCalledTimes(1);
        });
    });
});
