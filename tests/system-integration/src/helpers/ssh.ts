/**
 * @fileoverview SSH execution helpers for remote server testing.
 * Provides utilities to execute commands on a remote Unraid server via SSH.
 *
 * @requires SERVER environment variable to be set with the target server hostname/IP
 *
 * @example
 * ```typescript
 * // Execute a command and check the result
 * const result = await remoteExec('unraid-api status');
 * if (result.exitCode === 0) {
 *   console.log(result.stdout);
 * }
 *
 * // Execute a cleanup command, ignoring failures
 * await remoteExecSafe('rm -f /tmp/test-file');
 * ```
 */

import { execa } from 'execa';

/**
 * Result of a remote command execution.
 */
export interface ExecResult {
    /** Standard output from the command */
    stdout: string;
    /** Standard error from the command */
    stderr: string;
    /** Exit code of the command (0 indicates success) */
    exitCode: number;
}

/**
 * Retrieves the target server from the SERVER environment variable.
 * @throws {Error} If SERVER environment variable is not set
 * @returns The server hostname or IP address
 */
function getServer(): string {
    const server = process.env.SERVER;
    if (!server) {
        throw new Error('SERVER environment variable must be set');
    }
    return server;
}

/**
 * SSH connection options used for all remote executions.
 * - ConnectTimeout: 10 seconds
 * - BatchMode: Disables password prompts (requires key-based auth)
 * - StrictHostKeyChecking: Automatically accepts new host keys
 */
const SSH_OPTIONS = [
    '-o',
    'ConnectTimeout=10',
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=accept-new',
];

/**
 * Executes a command on the remote server via SSH.
 *
 * @param cmd - The shell command to execute on the remote server
 * @returns Promise resolving to the execution result with stdout, stderr, and exit code
 *
 * @example
 * ```typescript
 * const result = await remoteExec('unraid-api start');
 * if (result.exitCode !== 0) {
 *   throw new Error(`Failed: ${result.stderr}`);
 * }
 * ```
 */
export async function remoteExec(cmd: string): Promise<ExecResult> {
    const server = getServer();
    const result = await execa('ssh', [...SSH_OPTIONS, `root@${server}`, cmd], {
        reject: false,
    });

    return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? 0,
    };
}

/**
 * Executes a command on the remote server, suppressing any errors.
 * Useful for cleanup operations where failures should be ignored.
 *
 * @param cmd - The shell command to execute on the remote server
 * @returns Promise resolving to the execution result, or empty result on error
 *
 * @example
 * ```typescript
 * // Remove a file, ignoring if it doesn't exist
 * await remoteExecSafe('rm -f /var/run/unraid-api/nodemon.pid');
 * ```
 */
export async function remoteExecSafe(cmd: string): Promise<ExecResult> {
    const server = getServer();
    try {
        const result = await execa('ssh', [...SSH_OPTIONS, `root@${server}`, cmd], {
            reject: false,
        });
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode ?? 0,
        };
    } catch {
        return {
            stdout: '',
            stderr: '',
            exitCode: 0,
        };
    }
}

/**
 * Returns the configured server name from the SERVER environment variable.
 *
 * @throws {Error} If SERVER environment variable is not set
 * @returns The server hostname or IP address
 */
export function getServerName(): string {
    return getServer();
}
