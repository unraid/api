import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('nodemon path configuration', () => {
    const originalUnraidApiCwd = process.env.UNRAID_API_CWD;

    beforeEach(() => {
        vi.resetModules();
        delete process.env.UNRAID_API_CWD;
    });

    afterEach(() => {
        if (originalUnraidApiCwd === undefined) {
            delete process.env.UNRAID_API_CWD;
        } else {
            process.env.UNRAID_API_CWD = originalUnraidApiCwd;
        }
    });

    it('anchors nodemon paths to the package root by default', async () => {
        const environment = await import('@app/environment.js');
        const { UNRAID_API_ROOT, NODEMON_CONFIG_PATH, NODEMON_PATH, UNRAID_API_CWD } = environment;

        expect(UNRAID_API_CWD).toBe(UNRAID_API_ROOT);
        expect(NODEMON_CONFIG_PATH).toBe(join(UNRAID_API_ROOT, 'nodemon.json'));
        expect(NODEMON_PATH).toBe(join(UNRAID_API_ROOT, 'node_modules', 'nodemon', 'bin', 'nodemon.js'));
    });
});
