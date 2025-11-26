import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';

import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

const createLogStreamMock = (fd = 42, autoOpen = true) => {
    const listeners: Record<string, Array<(...args: any[]) => void>> = {};
    const stream: any = {
        fd,
        close: vi.fn(),
        destroy: vi.fn(),
        write: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
    };

    stream.once.mockImplementation((event: string, cb: (...args: any[]) => void) => {
        listeners[event] = listeners[event] ?? [];
        listeners[event].push(cb);
        if (event === 'open' && autoOpen) cb();
        return stream;
    });
    stream.off.mockImplementation((event: string, cb: (...args: any[]) => void) => {
        listeners[event] = (listeners[event] ?? []).filter((fn) => fn !== cb);
        return stream;
    });
    stream.emit = (event: string, ...args: any[]) => {
        (listeners[event] ?? []).forEach((fn) => fn(...args));
    };

    return stream as ReturnType<typeof createWriteStream> & {
        emit: (event: string, ...args: any[]) => void;
    };
};

vi.mock('node:fs', () => ({
    createWriteStream: vi.fn(),
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
    PATHS_NODEMON_LOG_FILE: '/var/log/unraid-api/nodemon.log',
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
        vi.mocked(createWriteStream).mockImplementation(() => createLogStreamMock());
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
        expect(mockMkdir).toHaveBeenCalledWith('/var/log', { recursive: true });
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
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 123,
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
                reject: false,
                stdio: ['ignore', logStream, logStream],
            }
        );
        expect(createWriteStream).toHaveBeenCalledWith('/var/log/unraid-api/nodemon.log', {
            flags: 'a',
        });
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
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const error = new Error('Command not found');
        vi.mocked(execa).mockImplementation(() => {
            throw error;
        });

        await expect(service.start()).rejects.toThrow('Failed to start nodemon: Command not found');
        expect(logStream.close).toHaveBeenCalled();
        expect(mockWriteFile).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    it('throws a clear error when the log file cannot be opened', async () => {
        const service = new NodemonService(logger);
        const logStream = createLogStreamMock(99, false);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const openError = new Error('EACCES: permission denied');
        setTimeout(() => logStream.emit('error', openError), 0);

        await expect(service.start()).rejects.toThrow(
            'Failed to start nodemon: EACCES: permission denied'
        );
        expect(logStream.destroy).toHaveBeenCalled();
        expect(execa).not.toHaveBeenCalled();
    });

    it('throws error and closes logStream when pid is missing', async () => {
        const service = new NodemonService(logger);
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: undefined,
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
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 456,
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

    it('restarts when a recorded nodemon pid is already running', async () => {
        const service = new NodemonService(logger);
        const stopSpy = vi.spyOn(service, 'stop').mockResolvedValue();
        vi.spyOn(
            service as unknown as { waitForNodemonExit: () => Promise<void> },
            'waitForNodemonExit'
        ).mockResolvedValue();
        vi.spyOn(
            service as unknown as { getStoredPid: () => Promise<number | null> },
            'getStoredPid'
        ).mockResolvedValue(999);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        ).mockResolvedValue(true);

        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 456,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await service.start();

        expect(stopSpy).toHaveBeenCalledWith({ quiet: true });
        expect(mockRm).toHaveBeenCalledWith('/var/run/unraid-api/nodemon.pid', { force: true });
        expect(execa).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            'unraid-api already running under nodemon (pid 999); restarting for a fresh start.'
        );
    });

    it('removes stale pid file and starts when recorded pid is dead', async () => {
        const service = new NodemonService(logger);
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 111,
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

    it('cleans up stray nodemon when no pid file exists', async () => {
        const service = new NodemonService(logger);
        findMatchingSpy.mockResolvedValue([888]);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        ).mockResolvedValue(true);
        vi.spyOn(
            service as unknown as { waitForNodemonExit: () => Promise<void> },
            'waitForNodemonExit'
        ).mockResolvedValue();

        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 222,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await service.start();

        expect(terminateSpy).toHaveBeenCalledWith([888]);
        expect(execa).toHaveBeenCalled();
    });

    it('terminates direct main.js processes before starting nodemon', async () => {
        const service = new NodemonService(logger);
        findMatchingSpy.mockResolvedValue([]);
        findDirectMainSpy.mockResolvedValue([321, 654]);

        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 777,
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

    it('waits for nodemon to exit during restart before starting again', async () => {
        const service = new NodemonService(logger);
        const stopSpy = vi.spyOn(service, 'stop').mockResolvedValue();
        const waitSpy = vi
            .spyOn(
                service as unknown as { waitForNodemonExit: () => Promise<void> },
                'waitForNodemonExit'
            )
            .mockResolvedValue();
        vi.spyOn(
            service as unknown as { getStoredPid: () => Promise<number | null> },
            'getStoredPid'
        ).mockResolvedValue(123);
        vi.spyOn(
            service as unknown as { isPidRunning: (pid: number) => Promise<boolean> },
            'isPidRunning'
        ).mockResolvedValue(true);
        const logStream = createLogStreamMock(99);
        vi.mocked(createWriteStream).mockReturnValue(logStream);
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 456,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await service.restart({ env: { LOG_LEVEL: 'DEBUG' } });

        expect(stopSpy).toHaveBeenCalledWith({ quiet: true });
        expect(waitSpy).toHaveBeenCalled();
        expect(execa).toHaveBeenCalled();
    });

    it('performs clean start on restart when nodemon is not running', async () => {
        const service = new NodemonService(logger);
        const stopSpy = vi.spyOn(service, 'stop').mockResolvedValue();
        const startSpy = vi.spyOn(service, 'start').mockResolvedValue();
        const waitSpy = vi
            .spyOn(
                service as unknown as { waitForNodemonExit: () => Promise<void> },
                'waitForNodemonExit'
            )
            .mockResolvedValue();
        vi.spyOn(
            service as unknown as { getStoredPid: () => Promise<number | null> },
            'getStoredPid'
        ).mockResolvedValue(null);

        await service.restart();

        expect(stopSpy).not.toHaveBeenCalled();
        expect(waitSpy).not.toHaveBeenCalled();
        expect(startSpy).toHaveBeenCalled();
    });
});
