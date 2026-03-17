import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StateFileKey } from '@app/store/types.js';

type WatchHandler = (path: string) => Promise<void>;

const handlersByPath = new Map<string, Partial<Record<'add' | 'change', WatchHandler>>>();

const createWatcher = (path: string) => ({
    on: vi.fn((event: 'add' | 'change', handler: WatchHandler) => {
        const existingHandlers = handlersByPath.get(path) ?? {};
        existingHandlers[event] = handler;
        handlersByPath.set(path, existingHandlers);
        return createWatcher(path);
    }),
});

const chokidarWatch = vi.fn((path: string) => createWatcher(path));

vi.mock('chokidar', () => ({
    watch: chokidarWatch,
}));

vi.mock('@app/environment.js', () => ({
    CHOKIDAR_USEPOLLING: false,
}));

vi.mock('@app/store/index.js', () => ({
    store: {
        dispatch: vi.fn(),
    },
    getters: {
        paths: vi.fn(() => ({
            states: '/usr/local/emhttp/state',
        })),
    },
}));

vi.mock('@app/store/modules/emhttp.js', () => ({
    loadSingleStateFile: vi.fn((key) => ({ type: 'emhttp/load-single-state-file', payload: key })),
}));

vi.mock('@app/core/log.js', () => ({
    emhttpLogger: {
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe('StateManager', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        handlersByPath.clear();

        const { StateManager } = await import('@app/store/watch/state-watch.js');
        StateManager.instance = null;
    });

    it('watches devs.ini alongside the other emhttp state files', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');

        StateManager.getInstance();

        expect(chokidarWatch).toHaveBeenCalledWith('/usr/local/emhttp/state/devs.ini', {
            usePolling: false,
        });
    });

    it('reloads the devs state when devs.ini changes', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');

        StateManager.getInstance();

        const changeHandler = handlersByPath.get('/usr/local/emhttp/state/devs.ini')?.change;
        expect(changeHandler).toBeDefined();

        await changeHandler?.('/usr/local/emhttp/state/devs.ini');

        expect(store.dispatch).toHaveBeenCalledWith(loadSingleStateFile(StateFileKey.devs));
    });
});
