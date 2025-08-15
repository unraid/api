import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { afterAll, beforeAll } from 'vitest';

// Get the project root directory
const projectRoot = resolve(process.cwd());
const apiJsonPath = join(projectRoot, 'dev/configs/api.json');
const apiJsonBackupPath = join(projectRoot, 'dev/configs/api.json.backup');

let originalContent: string | null = null;

/**
 * Backs up api.json before tests run and restores it after tests complete.
 * This prevents tests from permanently modifying the development configuration.
 */
export function setupApiJsonBackup() {
    beforeAll(() => {
        // Save the original content if the file exists
        if (existsSync(apiJsonPath)) {
            originalContent = readFileSync(apiJsonPath, 'utf-8');
            // Create a backup file as well for safety
            writeFileSync(apiJsonBackupPath, originalContent, 'utf-8');
        }
    });

    afterAll(() => {
        // Restore the original content if we saved it
        if (originalContent !== null) {
            writeFileSync(apiJsonPath, originalContent, 'utf-8');
        }
    });
}

// Auto-run for all tests that import this module
setupApiJsonBackup();
