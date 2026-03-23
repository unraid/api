import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StateFileKey } from '@app/store/types.js';

type WatchHandler = (path: string) => Promise<void>;
type WatchRegistration = {
    path: string;
    options: Record<string, unknown>;
    handlers: Partial<Record<'add' | 'change', WatchHandler>>;
};

const watchRegistrations: WatchRegistration[] = [];

const createWatcher = (registration: WatchRegistration) => ({
    on: vi.fn((event: 'add' | 'change', handler: WatchHandler) => {
        registration.handlers[event] = handler;
        return createWatcher(registration);
    }),
});

const chokidarWatch = vi.fn((path: string, options: Record<string, unknown> = {}) => {
    const registration: WatchRegistration = {
        path,
        options,
        handlers: {},
    };
    watchRegistrations.push(registration);
    return createWatcher(registration);
});

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

vi.mock('@app/store/modules/registration.js', () => ({
    loadRegistrationKey: vi.fn(() => ({ type: 'registration/load-registration-key' })),
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
        watchRegistrations.length = 0;

        const { StateManager } = await import('@app/store/watch/state-watch.js');
        StateManager.instance = null;
    });

    it('watches the emhttp state directory and keeps polling scoped to replacement-prone files', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');

        await StateManager.getInstance().ready;

        expect(chokidarWatch).toHaveBeenCalledTimes(3);
        expect(chokidarWatch).toHaveBeenNthCalledWith(
            1,
            '/usr/local/emhttp/state',
            expect.objectContaining({
                ignoreInitial: true,
                usePolling: false,
                ignored: expect.any(Function),
            })
        );
        expect(chokidarWatch).toHaveBeenNthCalledWith(
            2,
            '/usr/local/emhttp/state/disks.ini',
            expect.objectContaining({
                ignoreInitial: true,
                usePolling: true,
                interval: 10_000,
            })
        );
        expect(chokidarWatch).toHaveBeenNthCalledWith(
            3,
            '/usr/local/emhttp/state/shares.ini',
            expect.objectContaining({
                ignoreInitial: true,
                usePolling: true,
                interval: 10_000,
            })
        );
    });

    it('reconciles all emhttp state files after watchers are attached', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');
        const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

        await StateManager.getInstance().ready;

        expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
        expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());

        const dispatchedStateLoads = vi
            .mocked(store.dispatch)
            .mock.calls.filter(([action]) => action?.type === 'emhttp/load-single-state-file')
            .map(([action]) => action.payload);

        expect(dispatchedStateLoads).toEqual(Object.values(StateFileKey));
    });

    it('routes non-polled state files through the standard directory watcher', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');

        await StateManager.getInstance().ready;
        vi.mocked(store.dispatch).mockClear();

        const standardWatcher = watchRegistrations.find(
            (registration) => registration.options.usePolling === false
        );
        const changeHandler = standardWatcher?.handlers.change;
        expect(changeHandler).toBeDefined();

        await changeHandler?.('/usr/local/emhttp/state/devs.ini');

        expect(store.dispatch).toHaveBeenCalledWith(loadSingleStateFile(StateFileKey.devs));
    });

    it('ignores non-state files while still allowing non-polled state files through the directory watcher', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');

        await StateManager.getInstance().ready;

        const standardWatcher = watchRegistrations.find(
            (registration) => registration.options.usePolling === false
        );
        const ignored = standardWatcher?.options.ignored;

        expect(ignored).toBeTypeOf('function');
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state')).toBe(false);
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state/README.txt')).toBe(true);
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state/devs.ini')).toBe(false);
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state/var.ini.new')).toBe(
            false
        );
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state/disks.ini')).toBe(true);
        expect((ignored as (path: string) => boolean)('/usr/local/emhttp/state/disks.ini.new')).toBe(
            true
        );
    });

    it('reloads registration key when var.ini is replaced after boot', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');
        const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

        await StateManager.getInstance().ready;
        vi.mocked(store.dispatch).mockClear();

        const standardWatcher = watchRegistrations.find(
            (registration) => registration.options.usePolling === false
        );
        const addHandler = standardWatcher?.handlers.add;
        expect(addHandler).toBeDefined();

        await addHandler?.('/usr/local/emhttp/state/var.ini');

        expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
        expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());
    });

    it('reloads registration key when var.ini.new is observed after boot', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');
        const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

        await StateManager.getInstance().ready;
        vi.mocked(store.dispatch).mockClear();

        const standardWatcher = watchRegistrations.find(
            (registration) => registration.options.usePolling === false
        );
        const addHandler = standardWatcher?.handlers.add;
        expect(addHandler).toBeDefined();

        await addHandler?.('/usr/local/emhttp/state/var.ini.new');

        expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
        expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());
    });

    it('routes polled state files through the polling directory watcher', async () => {
        const { StateManager } = await import('@app/store/watch/state-watch.js');
        const { store } = await import('@app/store/index.js');
        const { loadSingleStateFile } = await import('@app/store/modules/emhttp.js');

        await StateManager.getInstance().ready;
        vi.mocked(store.dispatch).mockClear();

        const pollingWatcher = watchRegistrations.find(
            (registration) => registration.path === '/usr/local/emhttp/state/disks.ini'
        );
        const changeHandler = pollingWatcher?.handlers.change;
        expect(changeHandler).toBeDefined();

        await changeHandler?.('/usr/local/emhttp/state/disks.ini');

        expect(store.dispatch).toHaveBeenCalledWith(loadSingleStateFile(StateFileKey.disks));
    });
});
