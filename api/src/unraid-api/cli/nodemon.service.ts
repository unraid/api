import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { execa } from 'execa';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import {
    NODEMON_CONFIG_PATH,
    NODEMON_PATH,
    NODEMON_PID_PATH,
    PATHS_LOGS_DIR,
    PATHS_LOGS_FILE,
    UNRAID_API_CWD,
} from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

type StartOptions = {
    env?: Record<string, string | undefined>;
};

type StopOptions = {
    /** When true, uses SIGKILL instead of SIGTERM */
    force?: boolean;
    /** Suppress warnings when there is no pid file */
    quiet?: boolean;
};

@Injectable()
export class NodemonService {
    constructor(private readonly logger: LogService) {}

    async ensureNodemonDependencies() {
        try {
            await mkdir(PATHS_LOGS_DIR, { recursive: true });
            await mkdir(dirname(NODEMON_PID_PATH), { recursive: true });
        } catch (error) {
            this.logger.error(
                `Failed to fully ensure nodemon dependencies: ${error instanceof Error ? error.message : error}`
            );
        }
    }

    private async getStoredPid(): Promise<number | null> {
        if (!(await fileExists(NODEMON_PID_PATH))) return null;
        const contents = (await readFile(NODEMON_PID_PATH, 'utf-8')).trim();
        const pid = Number.parseInt(contents, 10);
        return Number.isNaN(pid) ? null : pid;
    }

    private async isPidRunning(pid: number): Promise<boolean> {
        try {
            process.kill(pid, 0);
            return true;
        } catch {
            return false;
        }
    }

    async start(options: StartOptions = {}) {
        await this.ensureNodemonDependencies();
        await this.stop({ quiet: true });

        const env = { ...process.env, ...options.env } as Record<string, string>;
        const logStream = createWriteStream(PATHS_LOGS_FILE, { flags: 'a' });

        const nodemonProcess = execa(NODEMON_PATH, ['--config', NODEMON_CONFIG_PATH, '--quiet'], {
            cwd: UNRAID_API_CWD,
            env,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        nodemonProcess.stdout?.pipe(logStream);
        nodemonProcess.stderr?.pipe(logStream);
        nodemonProcess.unref();

        if (nodemonProcess.pid) {
            await writeFile(NODEMON_PID_PATH, `${nodemonProcess.pid}`);
            this.logger.info(`Started nodemon (pid ${nodemonProcess.pid})`);
        } else {
            this.logger.error('Failed to determine nodemon pid.');
        }
    }

    async stop(options: StopOptions = {}) {
        const pid = await this.getStoredPid();
        if (!pid) {
            if (!options.quiet) {
                this.logger.warn('No nodemon pid file found. Nothing to stop.');
            }
            return;
        }

        const signal: NodeJS.Signals = options.force ? 'SIGKILL' : 'SIGTERM';
        try {
            process.kill(pid, signal);
            this.logger.trace(`Sent ${signal} to nodemon (pid ${pid})`);
        } catch (error) {
            this.logger.error(`Failed to stop nodemon (pid ${pid}): ${error}`);
        } finally {
            await rm(NODEMON_PID_PATH, { force: true });
        }
    }

    async restart(options: StartOptions = {}) {
        await this.stop({ quiet: true });
        await this.start(options);
    }

    async status(): Promise<boolean> {
        const pid = await this.getStoredPid();
        if (!pid) {
            this.logger.info('unraid-api is not running (no pid file).');
            return false;
        }

        const running = await this.isPidRunning(pid);
        if (running) {
            this.logger.info(`unraid-api is running under nodemon (pid ${pid}).`);
        } else {
            this.logger.warn(`Found nodemon pid file (${pid}) but the process is not running.`);
            await rm(NODEMON_PID_PATH, { force: true });
        }
        return running;
    }

    async logs(lines = 100) {
        const { stdout } = await execa('tail', ['-n', `${lines}`, PATHS_LOGS_FILE]);
        this.logger.log(stdout);
    }
}
