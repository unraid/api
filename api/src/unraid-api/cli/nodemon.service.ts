import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { openSync, writeSync } from 'node:fs';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { execa } from 'execa';

import { fileExists, fileExistsSync } from '@app/core/utils/files/file-exists.js';
import {
    NODEMON_CONFIG_PATH,
    NODEMON_PATH,
    NODEMON_PID_PATH,
    PATHS_LOGS_DIR,
    PATHS_LOGS_FILE,
    PATHS_NODEMON_LOG_FILE,
    UNRAID_API_CWD,
    UNRAID_API_SERVER_ENTRYPOINT,
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

const BOOT_LOG_PATH = '/var/log/unraid-api/boot.log';

@Injectable()
export class NodemonService {
    constructor(private readonly logger: LogService) {}

    private async logToBootFile(message: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [nodemon-service] ${message}\n`;
        try {
            await appendFile(BOOT_LOG_PATH, line);
        } catch {
            // Fallback to console if file write fails (e.g., directory doesn't exist yet)
        }
    }

    private validatePaths(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!fileExistsSync(NODEMON_PATH)) {
            errors.push(`NODEMON_PATH does not exist: ${NODEMON_PATH}`);
        }
        if (!fileExistsSync(NODEMON_CONFIG_PATH)) {
            errors.push(`NODEMON_CONFIG_PATH does not exist: ${NODEMON_CONFIG_PATH}`);
        }
        if (!fileExistsSync(UNRAID_API_CWD)) {
            errors.push(`UNRAID_API_CWD does not exist: ${UNRAID_API_CWD}`);
        }

        return { valid: errors.length === 0, errors };
    }

    async ensureNodemonDependencies() {
        await mkdir(PATHS_LOGS_DIR, { recursive: true });
        await mkdir(dirname(PATHS_LOGS_FILE), { recursive: true });
        await mkdir(dirname(PATHS_NODEMON_LOG_FILE), { recursive: true });
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
            const { stdout } = await execa('ps', ['-eo', 'pid,args']);
            return stdout
                .split('\n')
                .map((line) => line.trim())
                .map((line) => line.match(/^(\d+)\s+(.*)$/))
                .filter((match): match is RegExpMatchArray => Boolean(match))
                .map(([, pid, cmd]) => ({ pid: Number.parseInt(pid, 10), cmd }))
                .filter(({ cmd }) => cmd.includes(UNRAID_API_SERVER_ENTRYPOINT))
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

    /**
     * Wait for processes to exit, returns array of PIDs that didn't exit in time
     */
    private async waitForPidsToExit(pids: number[], timeoutMs = 5000): Promise<number[]> {
        if (timeoutMs <= 0) return pids.filter((pid) => pid > 0);

        const deadline = Date.now() + timeoutMs;
        const remaining = new Set(pids.filter((pid) => pid > 0));

        while (remaining.size > 0 && Date.now() < deadline) {
            for (const pid of remaining) {
                if (!(await this.isPidRunning(pid))) {
                    remaining.delete(pid);
                }
            }
            if (remaining.size > 0) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return [...remaining];
    }

    /**
     * Terminate PIDs with SIGTERM, then SIGKILL after timeout
     */
    private async terminatePidsWithForce(pids: number[], gracePeriodMs = 2000): Promise<void> {
        // Send SIGTERM to all
        for (const pid of pids) {
            try {
                process.kill(pid, 'SIGTERM');
            } catch {
                // Process may have already exited
            }
        }

        // Wait for graceful exit
        const remaining = await this.waitForPidsToExit(pids, gracePeriodMs);

        // Force kill any that didn't exit
        for (const pid of remaining) {
            try {
                process.kill(pid, 'SIGKILL');
                this.logger.debug?.(`Sent SIGKILL to pid ${pid}`);
            } catch {
                // Process may have already exited
            }
        }

        // Brief wait for SIGKILL to take effect
        if (remaining.length > 0) {
            await this.waitForPidsToExit(remaining, 1000);
        }
    }

    async start(options: StartOptions = {}) {
        // Log boot attempt with diagnostic info
        await this.logToBootFile('=== Starting unraid-api via nodemon ===');
        await this.logToBootFile(`NODEMON_PATH: ${NODEMON_PATH}`);
        await this.logToBootFile(`NODEMON_CONFIG_PATH: ${NODEMON_CONFIG_PATH}`);
        await this.logToBootFile(`UNRAID_API_CWD: ${UNRAID_API_CWD}`);
        await this.logToBootFile(`NODEMON_PID_PATH: ${NODEMON_PID_PATH}`);
        await this.logToBootFile(`process.cwd(): ${process.cwd()}`);
        await this.logToBootFile(`process.execPath: ${process.execPath}`);
        await this.logToBootFile(`PATH: ${process.env.PATH}`);

        // Validate paths before proceeding
        const { valid, errors } = this.validatePaths();
        if (!valid) {
            for (const error of errors) {
                await this.logToBootFile(`ERROR: ${error}`);
                this.logger.error(error);
            }
            throw new Error(`Path validation failed: ${errors.join('; ')}`);
        }
        await this.logToBootFile('Path validation passed');

        try {
            await this.ensureNodemonDependencies();
            await this.logToBootFile('Dependencies ensured');
        } catch (error) {
            const msg = `Failed to ensure nodemon dependencies: ${error instanceof Error ? error.message : error}`;
            await this.logToBootFile(`ERROR: ${msg}`);
            this.logger.error(msg);
            throw error;
        }

        await this.stopPm2IfRunning();
        await this.logToBootFile('PM2 cleanup complete');

        const existingPid = await this.getStoredPid();
        if (existingPid) {
            const running = await this.isPidRunning(existingPid);
            if (running) {
                await this.logToBootFile(`Found running nodemon (pid ${existingPid}), restarting`);
                this.logger.info(
                    `unraid-api already running under nodemon (pid ${existingPid}); restarting for a fresh start.`
                );
                await this.stop({ quiet: true });
                await this.waitForNodemonExit();
                await rm(NODEMON_PID_PATH, { force: true });
            } else {
                await this.logToBootFile(`Found stale pid file (${existingPid}), cleaning up`);
                this.logger.warn(
                    `Found nodemon pid file (${existingPid}) but the process is not running. Cleaning up.`
                );
                await rm(NODEMON_PID_PATH, { force: true });
            }
        }

        const discoveredPids = await this.findMatchingNodemonPids();
        const liveDiscoveredPids = await Promise.all(
            discoveredPids.map(async (pid) => ((await this.isPidRunning(pid)) ? pid : null))
        ).then((pids) => pids.filter((pid): pid is number => pid !== null));
        if (liveDiscoveredPids.length > 0) {
            await this.logToBootFile(`Found orphan nodemon processes: ${liveDiscoveredPids.join(', ')}`);
            this.logger.info(
                `Found nodemon process(es) (${liveDiscoveredPids.join(', ')}) without a pid file; restarting for a fresh start.`
            );
            await this.terminatePids(liveDiscoveredPids);
            await this.waitForNodemonExit();
        }

        const directMainPids = await this.findDirectMainPids();
        if (directMainPids.length > 0) {
            await this.logToBootFile(`Found direct main.js processes: ${directMainPids.join(', ')}`);
            this.logger.warn(
                `Found existing unraid-api process(es) running directly: ${directMainPids.join(', ')}. Stopping them before starting nodemon.`
            );
            await this.terminatePids(directMainPids);
        }

        const overrides = Object.fromEntries(
            Object.entries(options.env ?? {}).filter(([, value]) => value !== undefined)
        );
        const env = {
            ...process.env,
            // Ensure PATH includes standard locations for boot-time reliability
            PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
            NODE_ENV: 'production',
            PATHS_LOGS_FILE,
            PATHS_NODEMON_LOG_FILE,
            NODEMON_CONFIG_PATH,
            NODEMON_PID_PATH,
            UNRAID_API_CWD,
            UNRAID_API_SERVER_ENTRYPOINT,
            ...overrides,
        } as Record<string, string>;

        await this.logToBootFile(
            `Spawning: ${process.execPath} ${NODEMON_PATH} --config ${NODEMON_CONFIG_PATH}`
        );

        let logFd: number | null = null;
        try {
            // Use file descriptor for stdio - more reliable for detached processes at boot
            logFd = openSync(PATHS_NODEMON_LOG_FILE, 'a');

            // Write initial message to nodemon log
            writeSync(logFd, 'Starting nodemon...\n');

            // Use native spawn instead of execa for more reliable detached process handling
            const nodemonProcess = spawn(
                process.execPath, // Use current node executable path
                [NODEMON_PATH, '--config', NODEMON_CONFIG_PATH, '--quiet'],
                {
                    cwd: UNRAID_API_CWD,
                    env,
                    detached: true,
                    stdio: ['ignore', logFd, logFd],
                }
            );

            nodemonProcess.unref();

            if (!nodemonProcess.pid) {
                await this.logToBootFile('ERROR: Failed to spawn nodemon - no PID assigned');
                throw new Error('Failed to start nodemon: process spawned but no PID was assigned');
            }

            await writeFile(NODEMON_PID_PATH, `${nodemonProcess.pid}`);
            await this.logToBootFile(`Spawned nodemon with PID: ${nodemonProcess.pid}`);

            // Multiple verification checks with increasing delays for boot-time reliability
            const verificationDelays = [200, 500, 1000];
            for (const delay of verificationDelays) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                const stillRunning = await this.isPidRunning(nodemonProcess.pid);
                if (!stillRunning) {
                    const recentLogs = await this.logs(50);
                    await rm(NODEMON_PID_PATH, { force: true });
                    const logMessage = recentLogs ? ` Recent logs:\n${recentLogs}` : '';
                    await this.logToBootFile(`ERROR: Nodemon exited after ${delay}ms`);
                    await this.logToBootFile(`Recent logs: ${recentLogs}`);
                    throw new Error(`Nodemon exited immediately after start.${logMessage}`);
                }
                await this.logToBootFile(`Verification passed after ${delay}ms`);
            }

            await this.logToBootFile(`Successfully started nodemon (pid ${nodemonProcess.pid})`);
            this.logger.info(`Started nodemon (pid ${nodemonProcess.pid})`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.logToBootFile(`ERROR: ${errorMessage}`);
            throw new Error(`Failed to start nodemon: ${errorMessage}`);
        }
    }

    async stop(options: StopOptions = {}) {
        const nodemonPid = await this.getStoredPid();

        // Find child processes BEFORE sending any signals
        const childPids = await this.findDirectMainPids();

        if (!nodemonPid) {
            if (!options.quiet) {
                this.logger.warn('No nodemon pid file found.');
            }
            // Clean up orphaned children if any exist
            if (childPids.length > 0) {
                this.logger.warn(
                    `Found orphaned main.js processes: ${childPids.join(', ')}. Terminating.`
                );
                await this.terminatePidsWithForce(childPids);
            }
            return;
        }

        // Step 1: SIGTERM to nodemon (will forward to child)
        try {
            process.kill(nodemonPid, 'SIGTERM');
            this.logger.trace(`Sent SIGTERM to nodemon (pid ${nodemonPid})`);
        } catch (error) {
            // Process may have already exited
            this.logger.debug?.(`nodemon (pid ${nodemonPid}) already gone: ${error}`);
        }

        // Step 2: Wait for both nodemon and children to exit
        const allPids = [nodemonPid, ...childPids];
        const gracefulTimeout = options.force ? 0 : 5000;
        const remainingPids = await this.waitForPidsToExit(allPids, gracefulTimeout);

        // Step 3: Force kill any remaining processes
        if (remainingPids.length > 0) {
            this.logger.warn(`Force killing remaining processes: ${remainingPids.join(', ')}`);
            await this.terminatePidsWithForce(remainingPids);
        }

        // Step 4: Clean up PID file
        await rm(NODEMON_PID_PATH, { force: true });
    }

    async restart(options: StartOptions = {}) {
        // Delegate to start so both commands share identical logic
        await this.start(options);
    }

    async status(): Promise<boolean> {
        const pid = await this.getStoredPid();

        // Check for orphaned processes even without PID file
        const orphanNodemonPids = await this.findMatchingNodemonPids();
        const orphanMainPids = await this.findDirectMainPids();

        if (!pid) {
            if (orphanNodemonPids.length > 0 || orphanMainPids.length > 0) {
                this.logger.warn(
                    `No PID file, but found orphaned processes: nodemon=${orphanNodemonPids.join(',') || 'none'}, main.js=${orphanMainPids.join(',') || 'none'}`
                );
                return true; // Processes ARE running, just not tracked
            }
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
