import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

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

    private async stopPm2IfRunning() {
        const pm2PidPath = '/var/log/.pm2/pm2.pid';
        if (!(await fileExists(pm2PidPath))) return;

        const pm2Candidates = ['/usr/bin/pm2', '/usr/local/bin/pm2'];
        const pm2Path =
            (
                await Promise.all(
                    pm2Candidates.map(async (candidate) =>
                        (await fileExists(candidate)) ? candidate : null
                    )
                )
            ).find(Boolean) ?? null;

        if (pm2Path) {
            try {
                const { stdout } = await execa(pm2Path, ['jlist']);
                const processes = JSON.parse(stdout);
                const hasUnraid =
                    Array.isArray(processes) && processes.some((proc) => proc?.name === 'unraid-api');
                if (hasUnraid) {
                    await execa(pm2Path, ['delete', 'unraid-api']);
                    this.logger.info('Stopped pm2-managed unraid-api before starting nodemon.');
                }
            } catch (error) {
                // PM2 may not be installed or responding; keep this quiet to avoid noisy startup.
                this.logger.debug?.('Skipping pm2 cleanup (not installed or not running).');
            }
        }

        // Fallback: directly kill the pm2 daemon and remove its state, even if pm2 binary is missing.
        try {
            const pidText = (await readFile(pm2PidPath, 'utf-8')).trim();
            const pid = Number.parseInt(pidText, 10);
            if (!Number.isNaN(pid)) {
                process.kill(pid, 'SIGTERM');
                this.logger.debug?.(`Sent SIGTERM to pm2 daemon (pid ${pid}).`);
            }
        } catch {
            // ignore
        }
        await rm('/var/log/.pm2', { recursive: true, force: true });
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

    private async findMatchingNodemonPids(): Promise<number[]> {
        try {
            const { stdout } = await execa('ps', ['-eo', 'pid,args']);
            return stdout
                .split('\n')
                .map((line) => line.trim())
                .map((line) => line.match(/^(\d+)\s+(.*)$/))
                .filter((match): match is RegExpMatchArray => Boolean(match))
                .map(([, pid, cmd]) => ({ pid: Number.parseInt(pid, 10), cmd }))
                .filter(({ cmd }) => cmd.includes('nodemon') && cmd.includes(NODEMON_CONFIG_PATH))
                .map(({ pid }) => pid)
                .filter((pid) => Number.isInteger(pid));
        } catch {
            return [];
        }
    }

    private async findDirectMainPids(): Promise<number[]> {
        try {
            const mainPath = join(UNRAID_API_CWD, 'dist', 'main.js');
            const { stdout } = await execa('ps', ['-eo', 'pid,args']);
            return stdout
                .split('\n')
                .map((line) => line.trim())
                .map((line) => line.match(/^(\d+)\s+(.*)$/))
                .filter((match): match is RegExpMatchArray => Boolean(match))
                .map(([, pid, cmd]) => ({ pid: Number.parseInt(pid, 10), cmd }))
                .filter(({ cmd }) => cmd.includes(mainPath))
                .map(({ pid }) => pid)
                .filter((pid) => Number.isInteger(pid));
        } catch {
            return [];
        }
    }

    private async terminatePids(pids: number[]) {
        for (const pid of pids) {
            try {
                process.kill(pid, 'SIGTERM');
                this.logger.debug?.(`Sent SIGTERM to existing unraid-api process (pid ${pid}).`);
            } catch (error) {
                this.logger.debug?.(
                    `Failed to send SIGTERM to pid ${pid}: ${error instanceof Error ? error.message : error}`
                );
            }
        }
    }

    private async waitForNodemonExit(timeoutMs = 5000, pollIntervalMs = 100) {
        const deadline = Date.now() + timeoutMs;

        // Poll for any remaining nodemon processes that match our config file
        while (Date.now() < deadline) {
            const pids = await this.findMatchingNodemonPids();
            if (pids.length === 0) return;

            const runningFlags = await Promise.all(pids.map((pid) => this.isPidRunning(pid)));
            if (!runningFlags.some(Boolean)) return;

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }

        this.logger.debug?.('Timed out waiting for nodemon to exit; continuing restart anyway.');
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

        await this.stopPm2IfRunning();

        const existingPid = await this.getStoredPid();
        if (existingPid) {
            const running = await this.isPidRunning(existingPid);
            if (running) {
                this.logger.info(
                    `unraid-api already running under nodemon (pid ${existingPid}); skipping start.`
                );
                return;
            }
            this.logger.warn(
                `Found nodemon pid file (${existingPid}) but the process is not running. Cleaning up.`
            );
            await rm(NODEMON_PID_PATH, { force: true });
        }

        const discoveredPids = await this.findMatchingNodemonPids();
        const discoveredPid = discoveredPids.at(0);
        if (discoveredPid && (await this.isPidRunning(discoveredPid))) {
            await writeFile(NODEMON_PID_PATH, `${discoveredPid}`);
            this.logger.info(
                `unraid-api already running under nodemon (pid ${discoveredPid}); discovered via process scan.`
            );
            return;
        }

        const directMainPids = await this.findDirectMainPids();
        if (directMainPids.length > 0) {
            this.logger.warn(
                `Found existing unraid-api process(es) running directly: ${directMainPids.join(', ')}. Stopping them before starting nodemon.`
            );
            await this.terminatePids(directMainPids);
        }

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

            // Give nodemon a brief moment to boot, then verify it is still alive.
            await new Promise((resolve) => setTimeout(resolve, 200));
            const stillRunning = await this.isPidRunning(nodemonProcess.pid);
            if (!stillRunning) {
                const recentLogs = await this.logs(50);
                await rm(NODEMON_PID_PATH, { force: true });
                logStream.close();
                const logMessage = recentLogs ? ` Recent logs:\n${recentLogs}` : '';
                throw new Error(`Nodemon exited immediately after start.${logMessage}`);
            }

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
        await this.waitForNodemonExit();
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
