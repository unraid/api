import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';

import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

vi.mock('node:fs', () => ({
    createWriteStream: vi.fn(() => ({ pipe: vi.fn() })),
}));
vi.mock('node:fs/promises');
vi.mock('execa', () => ({ execa: vi.fn() }));
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn().mockResolvedValue(false),
}));
vi.mock('@app/environment.js', () => ({
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

    beforeEach(() => {
        vi.clearAllMocks();
        mockMkdir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined as unknown as void);
        mockRm.mockResolvedValue(undefined as unknown as void);
        vi.mocked(fileExists).mockResolvedValue(false);
    });

    it('ensures directories needed by nodemon exist', async () => {
        const service = new NodemonService(logger);

        await service.ensureNodemonDependencies();

        expect(mockMkdir).toHaveBeenCalledWith('/var/log/unraid-api', { recursive: true });
        expect(mockMkdir).toHaveBeenCalledWith('/var/run/unraid-api', { recursive: true });
    });

    it('starts nodemon and writes pid file', async () => {
        const service = new NodemonService(logger);
        const stdout = { pipe: vi.fn() };
        const stderr = { pipe: vi.fn() };
        const unref = vi.fn();
        vi.mocked(execa).mockReturnValue({
            pid: 123,
            stdout,
            stderr,
            unref,
        } as unknown as ReturnType<typeof execa>);

        await service.start({ env: { LOG_LEVEL: 'DEBUG' } });

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
    });

    it('returns not running when pid file is missing', async () => {
        const service = new NodemonService(logger);
        vi.mocked(fileExists).mockResolvedValue(false);

        const result = await service.status();

        expect(result).toBe(false);
        expect(logger.info).toHaveBeenCalledWith('unraid-api is not running (no pid file).');
    });
});
