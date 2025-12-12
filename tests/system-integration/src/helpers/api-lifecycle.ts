/**
 * @fileoverview API lifecycle management helpers for testing unraid-api daemon operations.
 * Provides high-level functions for starting, stopping, and managing the API daemon state.
 *
 * These helpers wrap the `unraid-api` CLI commands and provide proper wait/polling
 * logic to ensure operations complete before returning.
 *
 * @example
 * ```typescript
 * // Test setup
 * beforeEach(async () => {
 *   await cleanup(); // Ensure clean state
 * });
 *
 * // Start and verify
 * await startApi();
 * const status = await getStatus();
 * expect(status).toMatch(/running/i);
 *
 * // Stop and cleanup
 * await stopApi();
 * ```
 */

import { remoteExec, remoteExecSafe } from './ssh.js';
import { getRemotePid, isProcessRunning, countUnraidApiProcesses, REMOTE_PID_PATH } from './process.js';
import { sleep, TEN_SECONDS } from './utils.js';

/**
 * Default timeout for wait operations in milliseconds.
 */
const DEFAULT_TIMEOUT = TEN_SECONDS;

/**
 * Waits for the API to start by polling for PID file existence and process running state.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns `true` if the API started within the timeout, `false` otherwise
 *
 * @example
 * ```typescript
 * await remoteExec('unraid-api start');
 * const started = await waitForStart(15000);
 * if (!started) {
 *   throw new Error('API failed to start');
 * }
 * ```
 */
export async function waitForStart(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        const pid = await getRemotePid();
        if (pid && (await isProcessRunning(pid))) {
            return true;
        }
        await sleep(1000);
    }

    return false;
}

/**
 * Waits for the API to stop by polling until PID file is removed or process is not running.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns `true` if the API stopped within the timeout, `false` otherwise
 *
 * @example
 * ```typescript
 * await remoteExec('unraid-api stop');
 * const stopped = await waitForStop();
 * expect(stopped).toBe(true);
 * ```
 */
export async function waitForStop(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        const pid = await getRemotePid();
        if (!pid) {
            return true;
        }
        if (!(await isProcessRunning(pid))) {
            return true;
        }
        await sleep(1000);
    }

    return false;
}

/**
 * Waits for all API-related processes (nodemon and main.js) to terminate.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns `true` if all processes stopped within the timeout, `false` otherwise
 *
 * @example
 * ```typescript
 * await stopApi();
 * const allStopped = await waitForAllProcessesStop(15000);
 * expect(allStopped).toBe(true);
 * ```
 */
export async function waitForAllProcessesStop(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        const count = await countUnraidApiProcesses();
        if (count === 0) {
            return true;
        }
        await sleep(1000);
    }

    return false;
}

/**
 * Comprehensive cleanup function that ensures all API processes are terminated.
 *
 * Performs a multi-step cleanup process:
 * 1. Attempts graceful stop via `unraid-api stop`
 * 2. If processes remain, force kills nodemon first (prevents respawning)
 * 3. Then force kills any remaining main.js processes
 * 4. Removes the PID file
 * 5. As a last resort, kills processes by explicit PID
 *
 * This function is designed to be called in test setup/teardown hooks to ensure
 * a clean state between tests.
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanup();
 * });
 *
 * afterEach(async () => {
 *   await cleanup();
 * });
 * ```
 */
export async function cleanup(): Promise<void> {
    // Step 1: Try graceful stop via unraid-api
    await remoteExecSafe('unraid-api stop 2>/dev/null; true');
    await sleep(1000);

    // Step 2: Check if processes remain
    let count = await countUnraidApiProcesses();
    if (count === 0) {
        await remoteExecSafe(`rm -f '${REMOTE_PID_PATH}' 2>/dev/null; true`);
        return;
    }

    // Step 3: Force kill - nodemon FIRST (prevents restart of child)
    await remoteExecSafe("pkill -KILL -f 'nodemon.*nodemon.json' 2>/dev/null; true");
    await sleep(500);

    // Step 4: Force kill - then main.js children
    await remoteExecSafe("pkill -KILL -f 'node.*dist/main.js' 2>/dev/null; true");
    await sleep(1000);

    // Step 5: Clean up PID file
    await remoteExecSafe(`rm -f '${REMOTE_PID_PATH}' 2>/dev/null; true`);

    // Step 6: Verify - if still running, try harder with explicit PIDs
    count = await countUnraidApiProcesses();
    if (count !== 0) {
        const pidsResult = await remoteExecSafe(
            "ps -eo pid,args | grep -E 'nodemon.*nodemon.json|node.*dist/main.js' | grep -v grep | awk '{print $1}'"
        );
        const pids = pidsResult.stdout.trim().split('\n').filter(Boolean);
        for (const pid of pids) {
            await remoteExecSafe(`kill -9 ${pid} 2>/dev/null; true`);
        }
        await sleep(1000);
    }

    // Final check
    count = await countUnraidApiProcesses();
    if (count !== 0) {
        const psResult = await remoteExecSafe(
            "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep"
        );
        console.warn(`WARNING: Cleanup incomplete, remaining processes:\n${psResult.stdout}`);
    }
}

/**
 * Starts the unraid-api daemon and waits for it to be ready.
 *
 * @throws {Error} If the start command fails or the API doesn't start within the timeout
 *
 * @example
 * ```typescript
 * await startApi();
 * // API is now running and ready
 * await assertSingleApiInstance();
 * ```
 */
export async function startApi(): Promise<void> {
    const result = await remoteExec('unraid-api start');
    if (result.exitCode !== 0) {
        throw new Error(`Failed to start API: ${result.stderr}`);
    }
    const started = await waitForStart();
    if (!started) {
        throw new Error('API did not start within timeout');
    }
}

/**
 * Stops the unraid-api daemon and waits for termination.
 *
 * @param force - If `true`, uses `--force` flag for immediate termination (SIGKILL).
 *                If `false` (default), uses graceful shutdown (SIGTERM).
 * @throws {Error} If the stop command fails
 *
 * @example
 * ```typescript
 * // Graceful stop
 * await stopApi();
 *
 * // Force stop (immediate)
 * await stopApi(true);
 * ```
 */
export async function stopApi(force = false): Promise<void> {
    const cmd = force ? 'unraid-api stop --force' : 'unraid-api stop';
    const result = await remoteExec(cmd);
    if (result.exitCode !== 0) {
        throw new Error(`Failed to stop API: ${result.stderr}`);
    }
    await waitForStop();
    await waitForAllProcessesStop(TEN_SECONDS);
}

/**
 * Retrieves the current status of the unraid-api daemon.
 *
 * @returns The status output from `unraid-api status` command
 *
 * @example
 * ```typescript
 * const status = await getStatus();
 * if (status.includes('running')) {
 *   console.log('API is active');
 * } else {
 *   console.log('API is stopped');
 * }
 * ```
 */
export async function getStatus(): Promise<string> {
    const result = await remoteExec('unraid-api status 2>&1');
    return result.stdout;
}
