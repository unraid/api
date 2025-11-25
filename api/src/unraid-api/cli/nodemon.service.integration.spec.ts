import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const logger = {
    trace: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
} as const;

describe('NodemonService (real nodemon)', () => {
    const tmpRoot = join(tmpdir(), 'nodemon-service-');
    let workdir: string;
    let scriptPath: string;
    let configPath: string;
    let logPath: string;
    let pidPath: string;
    const nodemonPath = join(process.cwd(), 'node_modules', 'nodemon', 'bin', 'nodemon.js');

    beforeAll(async () => {
        workdir = await mkdtemp(tmpRoot);
        scriptPath = join(workdir, 'app.js');
        configPath = join(workdir, 'nodemon.json');
        logPath = join(workdir, 'nodemon.log');
        pidPath = join(workdir, 'nodemon.pid');

        await writeFile(
            scriptPath,
            ["console.log('nodemon-integration-start');", 'setInterval(() => {}, 1000);'].join('\n')
        );

        await writeFile(
            configPath,
            JSON.stringify(
                {
                    watch: ['app.js'],
                    exec: 'node ./app.js',
                    signal: 'SIGTERM',
                    ext: 'js',
                },
                null,
                2
            )
        );
    });

    afterAll(async () => {
        await rm(workdir, { recursive: true, force: true });
    });

    it('starts and stops real nodemon and writes logs', async () => {
        vi.resetModules();
        vi.doMock('@app/environment.js', () => ({
            LOG_LEVEL: 'INFO',
            LOG_TYPE: 'pretty',
            SUPPRESS_LOGS: false,
            API_VERSION: 'test-version',
            NODEMON_CONFIG_PATH: configPath,
            NODEMON_PATH: nodemonPath,
            NODEMON_PID_PATH: pidPath,
            PATHS_LOGS_DIR: workdir,
            PATHS_LOGS_FILE: logPath,
            UNRAID_API_CWD: workdir,
        }));

        const { NodemonService } = await import('./nodemon.service.js');
        const service = new NodemonService(logger);

        await service.start();

        const pidText = (await readFile(pidPath, 'utf-8')).trim();
        const pid = Number.parseInt(pidText, 10);
        expect(Number.isInteger(pid) && pid > 0).toBe(true);

        const logStats = await stat(logPath);
        expect(logStats.isFile()).toBe(true);
        await waitForLogEntry(logPath, 'nodemon-integration-start');

        await service.stop();
        await waitForExit(pid);
        await expect(stat(pidPath)).rejects.toThrow();
    }, 20_000);
});

async function waitForLogEntry(path: string, needle: string, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;

    while (true) {
        try {
            const contents = await readFile(path, 'utf-8');
            if (contents.includes(needle)) return contents;
        } catch {
            // ignore until timeout
        }

        if (Date.now() > deadline) {
            throw new Error(`Log entry "${needle}" not found in ${path} within ${timeoutMs}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}

async function waitForExit(pid: number, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;

    while (true) {
        try {
            process.kill(pid, 0);
        } catch {
            return;
        }
        if (Date.now() > deadline) {
            throw new Error(`Process ${pid} did not exit within ${timeoutMs}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}
