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
        await mkdir(PATHS_LOGS_DIR, { recursive: true });
        await mkdir(dirname(NODEMON_PID_PATH), { recursive: true });
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
        try {
            await this.ensureNodemonDependencies();
        } catch (error) {
            this.logger.error(
                `Failed to ensure nodemon dependencies: ${error instanceof Error ? error.message : error}`
            );
            throw error;
        }

        await this.stop({ quiet: true });

        const overrides = Object.fromEntries(
            Object.entries(options.env ?? {}).filter(([, value]) => value !== undefined)
        );
        const env = { ...process.env, ...overrides } as Record<string, string>;
        const logStream = createWriteStream(PATHS_LOGS_FILE, { flags: 'a' });

        let nodemonProcess;
        try {
            nodemonProcess = execa(NODEMON_PATH, ['--config', NODEMON_CONFIG_PATH, '--quiet'], {
                cwd: UNRAID_API_CWD,
                env,
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            nodemonProcess.stdout?.pipe(logStream);
            nodemonProcess.stderr?.pipe(logStream);
            nodemonProcess.unref();

            if (!nodemonProcess.pid) {
                logStream.close();
                throw new Error('Failed to start nodemon: process spawned but no PID was assigned');
            }

            await writeFile(NODEMON_PID_PATH, `${nodemonProcess.pid}`);
            this.logger.info(`Started nodemon (pid ${nodemonProcess.pid})`);
        } catch (error) {
            logStream.close();
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to start nodemon: ${errorMessage}`);
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

    async logs(lines = 100): Promise<string> {
        try {
            const { stdout } = await execa('tail', ['-n', `${lines}`, PATHS_LOGS_FILE]);
            this.logger.log(stdout);
            return stdout;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isFileNotFound =
                errorMessage.includes('ENOENT') ||
                (error instanceof Error && 'code' in error && error.code === 'ENOENT');

            if (isFileNotFound) {
                this.logger.error(`Log file not found: ${PATHS_LOGS_FILE} (${errorMessage})`);
            } else {
                this.logger.error(`Failed to read logs from ${PATHS_LOGS_FILE}: ${errorMessage}`);
            }
            return '';
        }
    }
}
