import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';

import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

vi.mock('node:fs', () => ({
    createWriteStream: vi.fn(() => ({ pipe: vi.fn(), close: vi.fn() })),
}));
vi.mock('node:fs/promises');
vi.mock('execa', () => ({ execa: vi.fn() }));
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn().mockResolvedValue(false),
}));
vi.mock('@app/environment.js', () => ({
    LOG_LEVEL: 'INFO',
    SUPPRESS_LOGS: false,
    NODEMON_CONFIG_PATH: '/etc/unraid-api/nodemon.json',
    NODEMON_PATH: '/usr/bin/nodemon',
    NODEMON_PID_PATH: '/var/run/unraid-api/nodemon.pid',
    PATHS_LOGS_DIR: '/var/log/unraid-api',
    PATHS_LOGS_FILE: '/var/log/graphql-api.log',
    UNRAID_API_CWD: '/usr/local/unraid-api',
}));

describe('NodemonService', () => {
    const logger = {
        trace: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    } as unknown as NodemonService['logger'];

    const mockMkdir = vi.mocked(fs.mkdir);
    const mockWriteFile = vi.mocked(fs.writeFile);
    const mockRm = vi.mocked(fs.rm);
    const killSpy = vi.spyOn(process, 'kill');
    const stopPm2Spy = vi.spyOn(
        NodemonService.prototype as unknown as { stopPm2IfRunning: () => Promise<void> },
        'stopPm2IfRunning'
    );
    const findMatchingSpy = vi.spyOn(
        NodemonService.prototype as unknown as { findMatchingNodemonPids: () => Promise<number[]> },
        'findMatchingNodemonPids'
    );
    const findDirectMainSpy = vi.spyOn(
        NodemonService.prototype as unknown as { findDirectMainPids: () => Promise<number[]> },
        'findDirectMainPids'
    );
    const terminateSpy = vi.spyOn(
        NodemonService.prototype as unknown as { terminatePids: (pids: number[]) => Promise<void> },
        'terminatePids'
    );

    beforeEach(() => {
        vi.clearAllMocks();
        mockMkdir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined as unknown as void);
        mockRm.mockResolvedValue(undefined as unknown as void);
        vi.mocked(fileExists).mockResolvedValue(false);
        killSpy.mockReturnValue(true);
        findMatchingSpy.mockResolvedValue([]);
        findDirectMainSpy.mockResolvedValue([]);
        terminateSpy.mockResolvedValue();
        stopPm2Spy.mockResolvedValue();
    });

    it('ensures directories needed by nodemon exist', async () => {
        const service = new NodemonService(logger);

        await service.ensureNodemonDependencies();

        expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
        expect(mockMkdir).toHaveBeenCalledWith('/var/run/unraid-api', { recursive: true });
    });

    it('throws error when directory creation fails', async () => {
        const service = new NodemonService(logger);
        const error = new Error('Permission denied');
        mockMkdir.mockRejectedValue(error);

        await expect(service.ensureNodemonDependencies()).rejects.toThrow('Permission denied');
        expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
    });

    it('starts nodemon and writes pid file', async () => {
        const service = new NodemonService(logger);
        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 123,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);
        killSpy.mockReturnValue(true);
        findMatchingSpy.mockResolvedValue([]);

        await service.start({ env: { LOG_LEVEL: 'DEBUG' } });

        expect(stopPm2Spy).toHaveBeenCalled();
        expect(execa).toHaveBeenCalledWith(
            '/usr/bin/nodemon',
            ['--config', '/etc/unraid-api/nodemon.json', '--quiet'],
            {
                cwd: '/usr/local/unraid-api',
                env: expect.objectContaining({ LOG_LEVEL: 'DEBUG' }),
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
            }
        );
        expect(createWriteStream).toHaveBeenCalledWith('/var/log/graphql-api.log', { flags: 'a' });
        expect(stdout.pipe).toHaveBeenCalled();
        expect(stderr.pipe).toHaveBeenCalled();
        expect(unref).toHaveBeenCalled();
        expect(mockWriteFile).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', '123');
        expect(logger.info).toHaveBeenCalledWith('Started nodemon (pid 123)');
        expect(logStream.close).not.toHaveBeenCalled();
    });

    it('throws error and aborts start when directory creation fails', async () => {
        const service = new NodemonService(logger);
        const error = new Error('Permission denied');
        mockMkdir.mockRejectedValue(error);

        await expect(service.start()).rejects.toThrow('Permission denied');
        expect(logger.error).toHaveBeenCalledWith(
            'Failed to ensure nodemon dependencies: Permission denied'
        );
        expect(execa).not.toHaveBeenCalled();
    });

    it('throws error and closes logStream when execa fails', async () => {
        const service = new NodemonService(logger);
        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const error = new Error('Command not found');
        vi.mocked(execa).mockImplementation(() => {
            throw error;
        });

        await expect(service.start()).rejects.toThrow('Failed to start nodemon: Command not found');
        expect(logStream.close).toHaveBeenCalled();
        expect(mockWriteFile).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    it('throws error and closes logStream when pid is missing', async () => {
        const service = new NodemonService(logger);
        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: undefined,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await expect(service.start()).rejects.toThrow(
            'Failed to start nodemon: process spawned but no PID was assigned'
        );
        expect(logStream.close).toHaveBeenCalled();
        expect(mockWriteFile).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    it('throws when nodemon exits immediately after start', async () => {
        const service = new NodemonService(logger);
        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 456,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);
        killSpy.mockImplementation(() => {
            throw new Error('not running');
        });
        const logsSpy = vi.spyOn(service, 'logs').mockResolvedValue('recent log lines');

        await expect(service.start()).rejects.toThrow(/Nodemon exited immediately/);
        expect(logStream.close).toHaveBeenCalled();
        expect(mockRm).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', { force: true });
        expect(logsSpy).toHaveBeenCalledWith(50);
    });

    it('is a no-op when a recorded nodemon pid is already running', async () => {
        const service = new NodemonService(logger);
        vi.spyOn(
            service as unknown as { getStoredPid: () => Promise<number | null> },
            'getStoredPid'
        ).mockResolvedValue(999);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        ).mockResolvedValue(true);

        await service.start();

        expect(logger.info).toHaveBeenCalledWith(
            'unraid-api already running under nodemon (pid 999); skipping start.'
        );
        expect(execa).not.toHaveBeenCalled();
        expect(mockRm).not.toHaveBeenCalled();
    });

    it('removes stale pid file and starts when recorded pid is dead', async () => {
        const service = new NodemonService(logger);
        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 111,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);
        vi.spyOn(
            service as unknown as { getStoredPid: () => Promise<number | null> },
            'getStoredPid'
        ).mockResolvedValue(555);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        )
            .mockResolvedValueOnce(false)
            .mockResolvedValue(true);
        vi.spyOn(service, 'logs').mockResolvedValue('recent log lines');
        findMatchingSpy.mockResolvedValue([]);

        await service.start();

        expect(mockRm).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', { force: true });
        expect(execa).toHaveBeenCalled();
        expect(mockWriteFile).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', '111');
        expect(logger.warn).toHaveBeenCalledWith(
            'Found nodemon pid file (555) but the process is not running. Cleaning up.'
        );
    });

    it('adopts an already-running nodemon when no pid file exists', async () => {
        const service = new NodemonService(logger);
        findMatchingSpy.mockResolvedValue([888]);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        ).mockResolvedValue(true);

        await service.start();

        expect(mockWriteFile).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', '888');
        expect(logger.info).toHaveBeenCalledWith(
            'unraid-api already running under nodemon (pid 888); discovered via process scan.'
        );
        expect(execa).not.toHaveBeenCalled();
    });

    it('terminates direct main.js processes before starting nodemon', async () => {
        const service = new NodemonService(logger);
        findMatchingSpy.mockResolvedValue([]);
        findDirectMainSpy.mockResolvedValue([321, 654]);

        const logStream = { pipe: vi.fn(), close: vi.fn() };
        vi.mocked(createWriteStream).mockReturnValue(
            logStream as unknown as ReturnType<typeof createWriteStream>
        );
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 777,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await service.start();

        expect(terminateSpy).toHaveBeenCalledWith([321, 654]);
        expect(execa).toHaveBeenCalledWith(
            '/usr/bin/nodemon',
            ['--config', '/etc/unraid-api/nodemon.json', '--quiet'],
            expect.objectContaining({ cwd: '/usr/local/unraid-api' })
        );
    });

    it('returns not running when pid file is missing', async () => {
        const service = new NodemonService(logger);
        vi.mocked(fileExists).mockResolvedValue(false);

        const result = await service.status();

        expect(result).toBe(false);
        expect(logger.info).toHaveBeenCalledWith('unraid-api is not running (no pid file).');
    });

    it('logs stdout when tail succeeds', async () => {
        const service = new NodemonService(logger);
        vi.mocked(execa).mockResolvedValue({
            stdout: 'log line 1\nlog line 2',
        } as unknown as Awaited<ReturnType<typeof execa>>);

        const result = await service.logs(50);

        expect(execa).toHaveBeenCalledWith('tail', ['-n', '50', '/var/log/graphql-api.log']);
        expect(logger.log).toHaveBeenCalledWith('log line 1\nlog line 2');
        expect(result).toBe('log line 1\nlog line 2');
    });

    it('handles ENOENT error when log file is missing', async () => {
        const service = new NodemonService(logger);
        const error = new Error('ENOENT: no such file or directory');
        (error as Error & { code?: string }).code = 'ENOENT';
        vi.mocked(execa).mockRejectedValue(error);

        const result = await service.logs();

        expect(logger.error).toHaveBeenCalledWith(
            'Log file not found: /var/log/graphql-api.log (ENOENT: no such file or directory)'
        );
        expect(result).toBe('');
    });

    it('handles non-zero exit error from tail', async () => {
        const service = new NodemonService(logger);
        const error = new Error('Command failed with exit code 1');
        vi.mocked(execa).mockRejectedValue(error);

        const result = await service.logs(100);

        expect(logger.error).toHaveBeenCalledWith(
            'Failed to read logs from /var/log/graphql-api.log: Command failed with exit code 1'
        );
        expect(result).toBe('');
    });
});
