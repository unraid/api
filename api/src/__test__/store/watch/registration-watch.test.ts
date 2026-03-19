import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StateFileKey } from '@app/store/types.js';

let registrationKeyWatchHandler: ((event: string, path: string) => Promise<void>) | undefined;

const chokidarWatcher = {
    on: vi.fn(),
};

const chokidarWatch = vi.fn(() => chokidarWatcher);

vi.mock('chokidar', () => ({
    watch: chokidarWatch,
}));

vi.mock('@app/store/index.js', () => ({
    store: {
        dispatch: vi.fn(),
    },
}));

vi.mock('@app/store/modules/emhttp.js', () => ({
    loadSingleStateFile: vi.fn((key) => ({ type: 'emhttp/load-single-state-file', payload: key })),
}));

vi.mock('@app/store/modules/registration.js', () => ({
    loadRegistrationKey: vi.fn(() => ({ type: 'registration/load-registration-key' })),
}));

vi.mock('@app/core/log.js', () => ({
    keyServerLogger: {
        info: vi.fn(),
    },
}));

describe('registration-watch', () => {
    let store: { dispatch: ReturnType<typeof vi.fn> };
    let loadSingleStateFile: ReturnType<typeof vi.fn>;
    let loadRegistrationKey: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();
        registrationKeyWatchHandler = undefined;

        const storeModule = await import('@app/store/index.js');
        const emhttpModule = await import('@app/store/modules/emhttp.js');
        const registrationModule = await import('@app/store/modules/registration.js');

        store = storeModule.store as unknown as typeof store;
        loadSingleStateFile = emhttpModule.loadSingleStateFile as unknown as typeof loadSingleStateFile;
        loadRegistrationKey =
            registrationModule.loadRegistrationKey as unknown as typeof loadRegistrationKey;

        chokidarWatcher.on.mockImplementation((event, handler) => {
            if (event === 'all') {
                registrationKeyWatchHandler = handler;
            }
            return chokidarWatcher;
        });
    });

    it('reloadVarIniWithRetry dispatches var reload then registration key reload', async () => {
        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        await reloadVarIniWithRetry();

        expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
        expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());
    });

    it('watches key files and dispatches refresh sequence on key events', async () => {
        const { setupRegistrationKeyWatch } = await import('@app/store/watch/registration-watch.js');

        setupRegistrationKeyWatch();

        expect(chokidarWatch).toHaveBeenCalledWith('/boot/config', {
            persistent: true,
            ignoreInitial: true,
            ignored: expect.any(Function),
            usePolling: true,
            interval: 5000,
        });

        expect(registrationKeyWatchHandler).toBeDefined();

        await registrationKeyWatchHandler?.('add', '/boot/config/Pro.key');

        expect(store.dispatch).toHaveBeenNthCalledWith(1, loadSingleStateFile(StateFileKey.var));
        expect(store.dispatch).toHaveBeenNthCalledWith(2, loadRegistrationKey());
    });
});
