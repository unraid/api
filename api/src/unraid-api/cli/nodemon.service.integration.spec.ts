import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { LogService } from '@app/unraid-api/cli/log.service.js';

const logger = {
    clear: vi.fn(),
    shouldLog: vi.fn(() => true),
    table: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    always: vi.fn(),
} as unknown as LogService;

describe('NodemonService (real nodemon)', () => {
    const tmpRoot = join(tmpdir(), 'nodemon-service-');
    let workdir: string;
    let scriptPath: string;
    let configPath: string;
    let appLogPath: string;
    let nodemonLogPath: string;
    let pidPath: string;
    const nodemonPath = join(process.cwd(), 'node_modules', 'nodemon', 'bin', 'nodemon.js');

    beforeAll(async () => {
        workdir = await mkdtemp(tmpRoot);
        scriptPath = join(workdir, 'app.js');
        configPath = join(workdir, 'nodemon.json');
        appLogPath = join(workdir, 'app.log');
        nodemonLogPath = join(workdir, 'nodemon.log');
        pidPath = join(workdir, 'nodemon.pid');

        await writeFile(
            scriptPath,
            [
                "const { appendFileSync } = require('node:fs');",
                "const appLog = process.env.PATHS_LOGS_FILE || './app.log';",
                "const nodemonLog = process.env.PATHS_NODEMON_LOG_FILE || './nodemon.log';",
                "appendFileSync(appLog, 'app-log-entry\\n');",
                "appendFileSync(nodemonLog, 'nodemon-log-entry\\n');",
                "console.log('nodemon-integration-start');",
                'setInterval(() => {}, 1000);',
            ].join('\n')
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
            PATHS_LOGS_FILE: appLogPath,
            PATHS_NODEMON_LOG_FILE: nodemonLogPath,
            UNRAID_API_CWD: workdir,
            UNRAID_API_SERVER_ENTRYPOINT: join(workdir, 'app.js'),
        }));

        const { NodemonService } = await import('./nodemon.service.js');
        const service = new NodemonService(logger);

        await service.start();

        const pidText = (await readFile(pidPath, 'utf-8')).trim();
        const pid = Number.parseInt(pidText, 10);
        expect(Number.isInteger(pid) && pid > 0).toBe(true);

        const nodemonLogStats = await stat(nodemonLogPath);
        expect(nodemonLogStats.isFile()).toBe(true);
        await waitForLogEntry(nodemonLogPath, 'Starting nodemon');
        await waitForLogEntry(appLogPath, 'app-log-entry');

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
