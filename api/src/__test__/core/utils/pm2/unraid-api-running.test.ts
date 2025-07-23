import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { isUnraidApiRunning } from '@app/core/utils/pm2/unraid-api-running.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PM2_PATH = join(__dirname, '../../../../../node_modules/.bin/pm2');
const DUMMY_PROCESS_PATH = join(__dirname, 'dummy-process.js');
const TEST_PROCESS_NAME = 'test-unraid-api';

describe('isUnraidApiRunning integration test', () => {
    beforeAll(async () => {
        // Kill any existing test process
        try {
            await execa(PM2_PATH, ['delete', 'unraid-api']);
            await execa(PM2_PATH, ['delete', TEST_PROCESS_NAME]);
        } catch {
            // Ignore if process doesn't exist
        }

        // Kill any existing PM2 daemon to ensure clean state
        try {
            await execa(PM2_PATH, ['kill']);
        } catch {
            // Ignore if PM2 daemon not running
        }
    });

    afterAll(async () => {
        // Clean up after tests
        try {
            await execa(PM2_PATH, ['delete', 'unraid-api']);
            await execa(PM2_PATH, ['delete', TEST_PROCESS_NAME]);
            await execa(PM2_PATH, ['kill']);
        } catch {
            // Ignore cleanup errors
        }
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
    });

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
    });

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
