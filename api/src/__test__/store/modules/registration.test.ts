import { expect, test } from 'vitest';

import { store } from '@app/store/index.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { FileLoadStatus, StateFileKey } from '@app/store/types.js';

// Preloading imports for faster tests

test('Before loading key returns null', async () => {
    const { status, keyFile } = store.getState().registration;
    expect(status).toBe(FileLoadStatus.UNLOADED);
    expect(keyFile).toBe(null);
});

test('Requires emhttp to be loaded to find key file', async () => {
    // Load registration key into store
    await store.dispatch(loadRegistrationKey());

    // Check if store has state files loaded
    const { status, keyFile } = store.getState().registration;

    expect(status).toBe(FileLoadStatus.LOADED);
    expect(keyFile).toBe(null);
});

test('Returns empty key if key location is empty', async () => {
    const { updateEmhttpState } = await import('@app/store/modules/emhttp.js');
    const { loadRegistrationKey } = await import('@app/store/modules/registration.js');

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

    // Load registration key into store
    await store.dispatch(loadRegistrationKey());

    // Check if store has state files loaded
    const { status, keyFile } = store.getState().registration;
    expect(status).toBe(FileLoadStatus.LOADED);
    expect(keyFile).toBe('');
});
