/**
 * @fileoverview Server management helpers for system-level operations.
 * Provides utilities for rebooting and waiting for server availability.
 */

import { remoteExecSafe, remoteExec } from './ssh.js';
import { sleep, FIVE_SECONDS, FIVE_MINUTES, TEN_MINUTES } from './utils.js';

/**
 * Reboots the remote server.
 * Sends a reboot command via SSH and waits briefly for the connection to drop.
 */
export async function rebootServer(): Promise<void> {
    await remoteExecSafe('reboot');
}

/**
 * Waits for the server to go offline after a reboot command.
 * Polls SSH connectivity until the server stops responding or timeout is reached.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 5 minutes)
 * @returns `true` if the server went offline within the timeout, `false` otherwise
 */
export async function waitForServerOffline(timeout = FIVE_MINUTES): Promise<boolean> {
    const deadline = Date.now() + timeout;
    const pollInterval = FIVE_SECONDS;

    while (Date.now() < deadline) {
        const result = await remoteExec('echo online');
        if (result.exitCode !== 0 || !result.stdout.includes('online')) {
            return true;
        }
        await sleep(pollInterval);
    }

    return false;
}

/**
 * Waits for the server to come back online after a reboot.
 * Polls SSH connectivity until the server responds or timeout is reached.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 10 minutes)
 * @returns `true` if the server is online within the timeout, `false` otherwise
 */
export async function waitForServerOnline(timeout = TEN_MINUTES): Promise<boolean> {
    const deadline = Date.now() + timeout;
    const pollInterval = FIVE_SECONDS;

    while (Date.now() < deadline) {
        try {
            const result = await remoteExec('echo online');
            if (result.exitCode === 0 && result.stdout.includes('online')) {
                return true;
            }
        } catch {
            // SSH connection failed, server still rebooting
        }
        await sleep(pollInterval);
    }

    return false;
}
