import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StateFileKey } from '@app/store/types.js';

const testContext = vi.hoisted(() => ({
    states: '',
}));

const mockedStore = vi.hoisted(() => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
}));

const mockedGetters = vi.hoisted(() => ({
    paths: vi.fn(() => ({
        states: testContext.states,
    })),
}));

const mockedLoadSingleStateFile = vi.hoisted(() =>
    vi.fn((key: StateFileKey) => ({ type: 'emhttp/load-single-state-file', payload: key }))
);

const mockedLoadRegistrationKey = vi.hoisted(() =>
    vi.fn(() => ({ type: 'registration/load-registration-key' }))
);

vi.mock('@app/environment.js', () => ({
    CHOKIDAR_USEPOLLING: false,
}));

vi.mock('@app/store/index.js', () => ({
    store: mockedStore,
    getters: mockedGetters,
}));

vi.mock('@app/store/modules/emhttp.js', () => ({
    loadSingleStateFile: mockedLoadSingleStateFile,
}));

vi.mock('@app/store/modules/registration.js', () => ({
    loadRegistrationKey: mockedLoadRegistrationKey,
}));

vi.mock('@app/core/log.js', () => ({
    emhttpLogger: {
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe('StateManager integration', () => {
    let tempRoot: string;
    let statesDirectory: string;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        tempRoot = await mkdtemp(join(tmpdir(), 'state-watch-'));
        statesDirectory = join(tempRoot, 'state');
        await mkdir(statesDirectory);
        testContext.states = statesDirectory;

        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');

        await StateManager.getInstance().ready;
        await new Promise((resolve) => setTimeout(resolve, 500));
        vi.mocked(store.dispatch).mockClear();
    });

    afterEach(async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');

        if (StateManager.instance) {
            await StateManager.instance.close();
        }

        await rm(tempRoot, { recursive: true, force: true });
    });

    it('reloads var state when emhttp writes var.ini.new into the state directory', async () => {
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');
        const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

        await writeFile(join(statesDirectory, 'var.ini.new'), 'NAME="Gamer5"\n');

        await vi.waitFor(() => {
            expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
            expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());
        });
    });

    it('does not route disks.ini.new through the directory watcher', async () => {
        const { store } = await import('@app/store/index.js');

        await writeFile(join(statesDirectory, 'disks.ini.new'), '[disk1]\nname=disk1\n');
        await new Promise((resolve) => setTimeout(resolve, 250));

        expect(store.dispatch).not.toHaveBeenCalled();
    });
});
