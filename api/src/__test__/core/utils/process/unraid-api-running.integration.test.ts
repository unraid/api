import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('isUnraidApiRunning (nodemon pid detection)', () => {
    let tempDir: string;
    let pidPath: string;

    beforeAll(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'unraid-api-'));
        pidPath = join(tempDir, 'nodemon.pid');
    });

    afterAll(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    afterEach(() => {
        vi.resetModules();
    });

    async function loadIsRunning() {
        vi.doMock('@app/environment.js', async () => {
            const actual =
                await vi.importActual<typeof import('@app/environment.js')>('@app/environment.js');
            return { ...actual, NODEMON_PID_PATH: pidPath };
        });

        const module = await import('@app/core/utils/process/unraid-api-running.js');
        return module.isUnraidApiRunning;
    }

    it('returns false when pid file is missing', async () => {
        const isUnraidApiRunning = await loadIsRunning();

        expect(await isUnraidApiRunning()).toBe(false);
    });

    it('returns true when a live pid is recorded', async () => {
        writeFileSync(pidPath, `${process.pid}`);
        const isUnraidApiRunning = await loadIsRunning();

        expect(await isUnraidApiRunning()).toBe(true);
    });

    it('returns false when pid file is invalid', async () => {
        writeFileSync(pidPath, 'not-a-number');
        const isUnraidApiRunning = await loadIsRunning();

        expect(await isUnraidApiRunning()).toBe(false);
    });
});
