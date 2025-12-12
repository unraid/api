/**
 * @fileoverview Process query and assertion helpers for unraid-api daemon testing.
 * Provides utilities to inspect and validate process state on a remote Unraid server.
 *
 * The unraid-api runs as a singleton daemon with two processes:
 * - **nodemon**: Process supervisor that monitors and restarts the main process
 * - **main.js**: The actual API server (Node.js application)
 *
 * @example
 * ```typescript
 * // Check if the API is running
 * const pid = await getRemotePid();
 * if (pid && await isProcessRunning(pid)) {
 *   console.log('API is running with PID:', pid);
 * }
 *
 * // Verify singleton enforcement
 * await assertSingleApiInstance(); // Throws if not exactly 1 nodemon + 1 main.js
 * ```
 */

import { remoteExec, remoteExecSafe } from './ssh.js';

/**
 * Path to the PID file on the remote server.
 * This file contains the PID of the nodemon supervisor process.
 */
export const REMOTE_PID_PATH = '/var/run/unraid-api/nodemon.pid';

/**
 * Retrieves the PID from the remote PID file.
 *
 * @returns The PID as a string, or empty string if the file doesn't exist or is empty
 *
 * @example
 * ```typescript
 * const pid = await getRemotePid();
 * if (pid) {
 *   console.log('Found PID:', pid);
 * }
 * ```
 */
export async function getRemotePid(): Promise<string> {
    const result = await remoteExec(`cat '${REMOTE_PID_PATH}' 2>/dev/null || true`);
    return result.stdout.trim();
}

/**
 * Checks if the PID file exists on the remote server.
 *
 * @returns `true` if the PID file exists, `false` otherwise
 *
 * @example
 * ```typescript
 * if (await pidFileExists()) {
 *   console.log('PID file exists');
 * }
 * ```
 */
export async function pidFileExists(): Promise<boolean> {
    const result = await remoteExec(`test -f '${REMOTE_PID_PATH}'`);
    return result.exitCode === 0;
}

/**
 * Checks if a process with the given PID is currently running.
 * Uses `kill -0` which checks process existence without sending a signal.
 *
 * @param pid - The process ID to check
 * @returns `true` if the process is running, `false` if not running or PID is empty
 *
 * @example
 * ```typescript
 * const pid = await getRemotePid();
 * if (await isProcessRunning(pid)) {
 *   console.log('Process is alive');
 * }
 * ```
 */
export async function isProcessRunning(pid: string): Promise<boolean> {
    if (!pid) return false;
    const result = await remoteExec(`kill -0 '${pid}' 2>/dev/null`);
    return result.exitCode === 0;
}

/**
 * Counts the number of nodemon supervisor processes running.
 * Looks for processes matching the pattern `nodemon.*nodemon.json`.
 *
 * @returns The number of nodemon processes (should be 0 or 1 in normal operation)
 *
 * @example
 * ```typescript
 * const count = await countNodemonProcesses();
 * expect(count).toBe(1); // Exactly one supervisor should run
 * ```
 */
export async function countNodemonProcesses(): Promise<number> {
    const result = await remoteExecSafe(
        "ps -eo pid,args 2>/dev/null | grep -E 'nodemon.*nodemon.json' | grep -v grep | wc -l"
    );
    const count = parseInt(result.stdout.trim(), 10);
    return isNaN(count) ? 0 : count;
}

/**
 * Counts the number of main.js worker processes running.
 * Looks for processes matching the pattern `node.*dist/main.js`.
 *
 * @returns The number of main.js processes (should be 0 or 1 in normal operation)
 *
 * @example
 * ```typescript
 * const count = await countMainProcesses();
 * expect(count).toBe(1); // Exactly one worker should run
 * ```
 */
export async function countMainProcesses(): Promise<number> {
    const result = await remoteExecSafe(
        "ps -eo args 2>/dev/null | grep -E 'node.*dist/main\\.js' | grep -v grep | wc -l"
    );
    const count = parseInt(result.stdout.trim(), 10);
    return isNaN(count) ? 0 : count;
}

/**
 * Counts all unraid-api related processes (nodemon + main.js combined).
 *
 * @returns Total count of all API-related processes
 *
 * @example
 * ```typescript
 * const total = await countUnraidApiProcesses();
 * // Should be 2 when running (1 nodemon + 1 main.js)
 * // Should be 0 when stopped
 * ```
 */
export async function countUnraidApiProcesses(): Promise<number> {
    const nodemonCount = await countNodemonProcesses();
    const mainCount = await countMainProcesses();
    return nodemonCount + mainCount;
}

/**
 * Asserts that exactly one nodemon and one main.js process are running.
 * This validates proper singleton daemon enforcement.
 *
 * @throws {Error} If the process counts don't match expected values (1 each)
 *
 * @example
 * ```typescript
 * await startApi();
 * await assertSingleApiInstance(); // Passes if singleton is enforced
 * ```
 */
export async function assertSingleApiInstance(): Promise<void> {
    const nodemonCount = await countNodemonProcesses();
    const mainCount = await countMainProcesses();

    if (nodemonCount !== 1) {
        const psResult = await remoteExecSafe(
            "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep"
        );
        throw new Error(`Expected 1 nodemon process, found ${nodemonCount}\n${psResult.stdout}`);
    }

    if (mainCount !== 1) {
        const psResult = await remoteExecSafe(
            "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep"
        );
        throw new Error(`Expected 1 main.js process, found ${mainCount}\n${psResult.stdout}`);
    }
}

/**
 * Asserts that no unraid-api processes are running.
 * Used to verify clean shutdown.
 *
 * @throws {Error} If any nodemon or main.js processes are found
 *
 * @example
 * ```typescript
 * await stopApi();
 * await assertNoApiProcesses(); // Passes if all processes terminated
 * ```
 */
export async function assertNoApiProcesses(): Promise<void> {
    const nodemonCount = await countNodemonProcesses();
    const mainCount = await countMainProcesses();

    if (nodemonCount !== 0 || mainCount !== 0) {
        const psResult = await remoteExecSafe(
            "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep"
        );
        throw new Error(
            `Expected 0 processes, found nodemon=${nodemonCount} main.js=${mainCount}\n${psResult.stdout}`
        );
    }
}
