import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const VAR_FIXTURE = readFileSync(new URL('../../../../dev/states/var.ini', import.meta.url), 'utf-8');

const writeVarFixture = (dir: string, { fsState, mdState }: { fsState: string; mdState: string }) => {
    const content = VAR_FIXTURE.replace(/mdState="[^"]*"/, `mdState="${mdState}"`).replace(
        /fsState="[^"]*"/,
        `fsState="${fsState}"`
    );
    writeFileSync(join(dir, 'var.ini'), content);
};

describe('emhttp state reload after file replacement', () => {
    let tempDir: string;

    beforeEach(() => {
        vi.resetModules();
        tempDir = mkdtempSync(join(tmpdir(), 'emhttp-replacement-'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        rmSync(tempDir, { recursive: true, force: true });
    });

    test('reloads a replaced var.ini from the stale STARTED/Stopping state seen on Unraid hosts', async () => {
        writeVarFixture(tempDir, { mdState: 'STOPPED', fsState: 'Stopped' });

        const { store } = await import('@app/store/index.js');
        const { getArrayData } = await import('@app/core/modules/array/get-array-data.js');
        const { ArrayState } = await import('@app/unraid-api/graph/resolvers/array/array.model.js');
        const { loadSingleStateFile, loadStateFiles, updateEmhttpState } = await import(
            '@app/store/modules/emhttp.js'
        );
        const { StateFileKey } = await import('@app/store/types.js');

        const originalGetState = store.getState.bind(store);
        vi.spyOn(store, 'getState').mockImplementation(() => ({
            ...originalGetState(),
            paths: {
                ...originalGetState().paths,
                states: tempDir,
            },
        }));

        await store.dispatch(loadStateFiles());

        store.dispatch(
            updateEmhttpState({
                field: StateFileKey.var,
                state: {
                    mdState: ArrayState.STARTED,
                    fsState: 'Stopping',
                },
            })
        );

        expect(getArrayData(() => store.getState()).state).toBe(ArrayState.STARTED);
        expect(store.getState().emhttp.var.fsState).toBe('Stopping');

        await store.dispatch(loadSingleStateFile(StateFileKey.var));

        expect(store.getState().emhttp.var.mdState).toBe(ArrayState.STOPPED);
        expect(store.getState().emhttp.var.fsState).toBe('Stopped');
        expect(getArrayData(() => store.getState()).state).toBe(ArrayState.STOPPED);
    });
});
