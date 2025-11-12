import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { store } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
import { StateFileKey } from '@app/store/types.js';

const VAR_FIXTURE = readFileSync(new URL('../../../../dev/states/var.ini', import.meta.url), 'utf-8');

const writeVarFixture = (dir: string, safeMode: 'yes' | 'no') => {
    const content = VAR_FIXTURE.replace(/safeMode="(yes|no)"/, `safeMode="${safeMode}"`);
    writeFileSync(join(dir, `${StateFileKey.var}.ini`), content);
};

describe('loadStateFileSync', () => {
    let tempDir: string;
    let baseState: ReturnType<typeof store.getState>;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'state-file-'));
        baseState = store.getState();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('loads var.ini, updates the store, and returns the parsed state', () => {
        writeVarFixture(tempDir, 'yes');
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            paths: {
                ...baseState.paths,
                states: tempDir,
            },
        });
        const dispatchSpy = vi.spyOn(store, 'dispatch').mockImplementation((action) => action as any);

        const result = loadStateFileSync(StateFileKey.var);

        expect(result?.safeMode).toBe(true);
        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'emhttp/updateEmhttpState',
                payload: {
                    field: StateFileKey.var,
                    state: expect.objectContaining({ safeMode: true }),
                },
            })
        );
    });

    it('returns null when the states path is missing', () => {
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            paths: undefined,
        } as any);
        const dispatchSpy = vi.spyOn(store, 'dispatch');

        expect(loadStateFileSync(StateFileKey.var)).toBeNull();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('returns null when the requested state file cannot be found', () => {
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            paths: {
                ...baseState.paths,
                states: tempDir,
            },
        });
        const dispatchSpy = vi.spyOn(store, 'dispatch');

        expect(loadStateFileSync(StateFileKey.var)).toBeNull();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });
});
