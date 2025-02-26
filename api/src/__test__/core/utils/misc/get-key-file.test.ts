import { expect, test } from 'vitest';

import { store } from '@app/store/index.js';
import { FileLoadStatus, StateFileKey } from '@app/store/types.js';

import '@app/core/utils/misc/get-key-file.js';
import '@app/store/modules/emhttp.js';

test('Before loading key returns null', async () => {
    const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
    const { status } = store.getState().registration;

    expect(status).toBe(FileLoadStatus.UNLOADED);
    await expect(getKeyFile()).resolves.toBe(null);
});

test('Requires emhttp to be loaded to find key file', async () => {
    const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
    const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

    // Load registration key into store
    await store.dispatch(loadRegistrationKey());

    // Check if store has state files loaded
    const { status } = store.getState().registration;
    expect(status).toBe(FileLoadStatus.LOADED);
    await expect(getKeyFile()).resolves.toBe(null);
});

test('Returns empty key if key location is empty', async () => {
    const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
    const { updateEmhttpState } = await import('@app/store/modules/emhttp.js');

    // Set key file location as empty
    // This should only happen if the user doesn't have a key file
    store.dispatch(
        updateEmhttpState({
            field: StateFileKey.var,
            state: {
                regFile: '',
            },
        })
    );

    // Check if store has state files loaded
    const { status } = store.getState().registration;
    expect(status).toBe(FileLoadStatus.LOADED);
    await expect(getKeyFile()).resolves.toBe('');
});

test(
    'Returns decoded key file if key location exists',
    async () => {
        const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
        const { loadStateFiles } = await import('@app/store/modules/emhttp.js');

        // Load state files into store
        await store.dispatch(loadStateFiles());

        // Check if store has state files loaded
        const { status } = store.getState().registration;
        expect(status).toBe(FileLoadStatus.LOADED);
        await expect(getKeyFile()).resolves.toMatchInlineSnapshot(
            '"hVs1tLjvC9FiiQsIwIQ7G1KszAcexf0IneThhnmf22SB0dGs5WzRkqMiSMmt2DtR5HOXFUD32YyxuzGeUXmky3zKpSu6xhZNKVg5atGM1OfvkzHBMldI3SeBLuUFSgejLbpNUMdTrbk64JJdbzle4O8wiQgkIpAMIGxeYLwLBD4zHBcfyzq40QnxG--HcX6j25eE0xqa2zWj-j0b0rCAXahJV2a3ySCbPzr1MvfPRTVb0rr7KJ-25R592hYrz4H7Sc1B3p0lr6QUxHE6o7bcYrWKDRtIVoZ8SMPpd1_0gzYIcl5GsDFzFumTXUh8NEnl0Q8hwW1YE-tRc6Y_rrvd7w"'
        );
    },
    { timeout: 10000 }
);
