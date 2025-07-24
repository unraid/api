import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';
import pm2 from 'pm2';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { isUnraidApiRunning } from '@app/core/utils/pm2/unraid-api-running.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '../../../../..');
const DUMMY_PROCESS_PATH = join(__dirname, 'dummy-process.js');
const CLI_PATH = join(PROJECT_ROOT, 'dist/cli.js');
const TEST_PROCESS_NAME = 'test-unraid-api';

// Shared PM2 connection state
let pm2Connected = false;

// Helper function to run CLI command (assumes CLI is built)
async function runCliCommand(command: string, options: any = {}) {
    return await execa('node', [CLI_PATH, command], options);
}

// Helper to ensure PM2 connection is established
async function ensurePM2Connection() {
    if (pm2Connected) return;

    return new Promise<void>((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err);
                return;
            }
            pm2Connected = true;
            resolve();
        });
    });
}

// Helper to delete specific test processes (lightweight, reuses connection)
async function deleteTestProcesses() {
    if (!pm2Connected) {
        // No connection, nothing to clean up
        return;
    }

    const deletePromise = new Promise<void>((resolve) => {
        // Delete specific processes we might have created
        const processNames = ['unraid-api', TEST_PROCESS_NAME];
        let deletedCount = 0;

        const deleteNext = () => {
            if (deletedCount >= processNames.length) {
                resolve();
                return;
            }

            const processName = processNames[deletedCount];
            pm2.delete(processName, (deleteErr) => {
                // Ignore errors, process might not exist
                deletedCount++;
                deleteNext();
            });
        };

        deleteNext();
    });

    const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 3000); // 3 second timeout
    });

    return Promise.race([deletePromise, timeoutPromise]);
}

// Helper to ensure PM2 is completely clean (heavy cleanup with daemon kill)
async function cleanupAllPM2Processes() {
    // First delete test processes if we have a connection
    if (pm2Connected) {
        await deleteTestProcesses();
    }

    return new Promise<void>((resolve) => {
        // Always connect fresh for daemon kill (in case we weren't connected)
        pm2.connect((err) => {
            if (err) {
                // If we can't connect, assume PM2 is not running
                pm2Connected = false;
                resolve();
                return;
            }

            // Kill the daemon to ensure fresh state
            pm2.killDaemon((killErr) => {
                pm2.disconnect();
                pm2Connected = false;
                // Small delay to let PM2 fully shutdown
                setTimeout(resolve, 500);
            });
        });
    });
}

describe.skipIf(!!process.env.CI)('PM2 integration tests', () => {
    beforeAll(async () => {
        // Build the CLI if it doesn't exist (only for CLI tests)
        if (!existsSync(CLI_PATH)) {
            console.log('Building CLI for integration tests...');
            try {
                await execa('pnpm', ['build'], {
                    cwd: PROJECT_ROOT,
                    stdio: 'inherit',
                    timeout: 120000, // 2 minute timeout for build
                });
            } catch (error) {
                console.error('Failed to build CLI:', error);
                throw new Error(
                    'Cannot run CLI integration tests without built CLI. Run `pnpm build` first.'
                );
            }
        }

        // Only do a full cleanup once at the beginning
        await cleanupAllPM2Processes();
    }, 150000); // 2.5 minute timeout for setup

    afterAll(async () => {
        // Only do a full cleanup once at the end
        await cleanupAllPM2Processes();
    });

    afterEach(async () => {
        // Lightweight cleanup after each test - just delete our test processes
        await deleteTestProcesses();
    }, 5000); // 5 second timeout for cleanup

    describe('isUnraidApiRunning function', () => {
        it('should return false when PM2 is not running the unraid-api process', async () => {
            const result = await isUnraidApiRunning();
            expect(result).toBe(false);
        });

        it('should return true when PM2 has unraid-api process running', async () => {
            // Ensure PM2 connection
            await ensurePM2Connection();

            // Start a dummy process with the name 'unraid-api'
            await new Promise<void>((resolve, reject) => {
                pm2.start(
                    {
                        script: DUMMY_PROCESS_PATH,
                        name: 'unraid-api',
                    },
                    (startErr) => {
                        if (startErr) return reject(startErr);
                        resolve();
                    }
                );
            });

            // Give PM2 time to start the process
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const result = await isUnraidApiRunning();
            expect(result).toBe(true);
        }, 30000);

        it('should return false when unraid-api process is stopped', async () => {
            // Ensure PM2 connection
            await ensurePM2Connection();

            // Start and then stop the process
            await new Promise<void>((resolve, reject) => {
                pm2.start(
                    {
                        script: DUMMY_PROCESS_PATH,
                        name: 'unraid-api',
                    },
                    (startErr) => {
                        if (startErr) return reject(startErr);

                        // Stop the process after starting
                        setTimeout(() => {
                            pm2.stop('unraid-api', (stopErr) => {
                                if (stopErr) return reject(stopErr);
                                resolve();
                            });
                        }, 1000);
                    }
                );
            });

            await new Promise((resolve) => setTimeout(resolve, 1000));

            const result = await isUnraidApiRunning();
            expect(result).toBe(false);
        }, 30000);

        it('should handle PM2 connection errors gracefully', async () => {
            // Set an invalid PM2_HOME to force connection failure
            const originalPM2Home = process.env.PM2_HOME;
            process.env.PM2_HOME = '/invalid/path/that/does/not/exist';

            const result = await isUnraidApiRunning();
            expect(result).toBe(false);

            // Restore original PM2_HOME
            if (originalPM2Home) {
                process.env.PM2_HOME = originalPM2Home;
            } else {
                delete process.env.PM2_HOME;
            }
        }, 15000); // 15 second timeout to allow for the Promise.race timeout
    });
});
