import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { isUnraidApiRunning } from '@app/core/utils/pm2/unraid-api-running.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PM2_PATH = join(__dirname, '../../../../../node_modules/.bin/pm2');
const DUMMY_PROCESS_PATH = join(__dirname, 'dummy-process.js');
const TEST_PROCESS_NAME = 'test-unraid-api';

// Helper to ensure PM2 is completely clean
async function cleanupAllPM2Processes() {
    try {
        // Delete all processes we might have created
        await execa(PM2_PATH, ['delete', 'unraid-api'], { reject: false });
        await execa(PM2_PATH, ['delete', TEST_PROCESS_NAME], { reject: false });
        await execa(PM2_PATH, ['delete', 'all'], { reject: false });
        // Kill the daemon to ensure fresh state
        await execa(PM2_PATH, ['kill'], { reject: false });
        // Small delay to let PM2 fully shutdown
        await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
        // Ignore all errors in cleanup
    }
}

describe('isUnraidApiRunning integration test', () => {
    beforeAll(async () => {
        await cleanupAllPM2Processes();
    }, 30000);

    afterAll(async () => {
        await cleanupAllPM2Processes();
    });

    beforeEach(async () => {
        // Ensure clean state before each test
        await cleanupAllPM2Processes();
    });

    afterEach(async () => {
        // Clean up after each test
        await cleanupAllPM2Processes();
    });

    it('should return false when PM2 is not running the unraid-api process', async () => {
        const result = await isUnraidApiRunning();
        expect(result).toBe(false);
    });

    it('should return true when PM2 has unraid-api process running', async () => {
        // Start a dummy process with the name 'unraid-api'
        await execa(PM2_PATH, ['start', DUMMY_PROCESS_PATH, '--name', 'unraid-api'], {
            reject: false,
        });

        // Give PM2 time to start the process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const result = await isUnraidApiRunning();
        expect(result).toBe(true);

        // Clean up
        await execa(PM2_PATH, ['delete', 'unraid-api'], { reject: false });
    }, 30000);

    it('should return false when unraid-api process is stopped', async () => {
        // Start and then stop the process
        await execa(PM2_PATH, ['start', DUMMY_PROCESS_PATH, '--name', 'unraid-api'], {
            reject: false,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        await execa(PM2_PATH, ['stop', 'unraid-api'], { reject: false });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = await isUnraidApiRunning();
        expect(result).toBe(false);

        // Clean up
        await execa(PM2_PATH, ['delete', 'unraid-api'], { reject: false });
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
    });
});
