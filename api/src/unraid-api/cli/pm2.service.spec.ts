import * as fs from 'node:fs/promises';
import * as os from 'node:os';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

vi.mock('node:fs/promises');
vi.mock('node:os');
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
    const mockChown = vi.mocked(fs.chown);
    const mockChmod = vi.mocked(fs.chmod);
    const mockStat = vi.mocked(fs.stat);
    const mockUserInfo = vi.mocked(os.userInfo);

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

        mockUserInfo.mockReturnValue({
            uid: 1000,
            gid: 1000,
            username: 'testuser',
            homedir: '/home/testuser',
            shell: '/bin/bash',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('ensurePm2Dependencies', () => {
        it('should create PM2_HOME and logs directories with correct permissions', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockResolvedValue(undefined);
            mockStat.mockResolvedValue({
                isDirectory: () => true,
            } as any);

            await pm2Service.ensurePm2Dependencies();

            expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
            expect(mockMkdir).toHaveBeenCalledWith('/var/log/.pm2', { recursive: true });
            expect(mockChown).toHaveBeenCalledWith('/var/log/.pm2', 1000, 1000);
            expect(mockChmod).toHaveBeenCalledWith('/var/log/.pm2', 0o750);
            expect(logService.trace).toHaveBeenCalledWith(
                'Ensured PM2_HOME directory exists at /var/log/.pm2'
            );
            expect(logService.trace).toHaveBeenCalledWith(
                'Set PM2_HOME permissions: owner=1000:1000, mode=0750'
            );
        });

        it('should log warning when unable to set permissions but not throw', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockRejectedValue(new Error('Permission denied'));
            mockStat.mockResolvedValue({
                isDirectory: () => true,
            } as any);

            await expect(pm2Service.ensurePm2Dependencies()).resolves.not.toThrow();

            expect(mockMkdir).toHaveBeenCalledWith('/var/log/.pm2', { recursive: true });
            expect(mockChown).toHaveBeenCalledWith('/var/log/.pm2', 1000, 1000);
            expect(logService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Could not set optimal permissions for PM2_HOME')
            );
        });

        it('should log warning when PM2_HOME exists but is not a directory', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockResolvedValue(undefined);
            mockStat.mockResolvedValue({
                isDirectory: () => false,
            } as any);

            await pm2Service.ensurePm2Dependencies();

            expect(logService.warn).toHaveBeenCalledWith(
                'PM2_HOME at /var/log/.pm2 exists but is not a directory. PM2 operations may fail.'
            );
        });

        it('should log warning when unable to verify PM2_HOME directory', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockResolvedValue(undefined);
            mockStat.mockRejectedValue(new Error('ENOENT'));

            await pm2Service.ensurePm2Dependencies();

            expect(logService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Could not verify PM2_HOME directory')
            );
        });

        it('should log error but not throw when directory creation fails', async () => {
            mockMkdir.mockRejectedValue(new Error('Disk full'));

            await expect(pm2Service.ensurePm2Dependencies()).resolves.not.toThrow();

            expect(logService.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fully ensure PM2 dependencies: Disk full')
            );
        });

        it('should handle mkdir with recursive flag for nested paths', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockResolvedValue(undefined);
            mockStat.mockResolvedValue({
                isDirectory: () => true,
            } as any);

            await pm2Service.ensurePm2Dependencies();

            expect(mockMkdir).toHaveBeenCalledWith('/var/log/.pm2', { recursive: true });
            expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
        });

        it('should use current user uid and gid for ownership', async () => {
            mockUserInfo.mockReturnValue({
                uid: 2000,
                gid: 2000,
                username: 'anotheruser',
                homedir: '/home/anotheruser',
                shell: '/bin/bash',
            });

            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockResolvedValue(undefined);
            mockStat.mockResolvedValue({
                isDirectory: () => true,
            } as any);

            await pm2Service.ensurePm2Dependencies();

            expect(mockChown).toHaveBeenCalledWith('/var/log/.pm2', 2000, 2000);
            expect(logService.trace).toHaveBeenCalledWith(
                'Set PM2_HOME permissions: owner=2000:2000, mode=0750'
            );
        });

        it('should continue execution when chmod fails', async () => {
            mockMkdir.mockResolvedValue(undefined);
            mockChown.mockResolvedValue(undefined);
            mockChmod.mockRejectedValue(new Error('Operation not permitted'));
            mockStat.mockResolvedValue({
                isDirectory: () => true,
            } as any);

            await expect(pm2Service.ensurePm2Dependencies()).resolves.not.toThrow();

            expect(mockChmod).toHaveBeenCalledWith('/var/log/.pm2', 0o750);
            expect(logService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Could not set optimal permissions')
            );
        });
    });
});
