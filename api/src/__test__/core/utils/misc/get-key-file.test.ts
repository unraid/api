import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { store } from '@app/store/index.js';
import { FileLoadStatus, StateFileKey } from '@app/store/types.js';

import '@app/store/modules/emhttp.js';

vi.mock('fs/promises');

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
    expect(status).toBe(FileLoadStatus.UNLOADED);
    await expect(getKeyFile()).resolves.toBe('');
});

test('Returns empty string when key file does not exist (ENOENT)', async () => {
    const { readFile } = await import('fs/promises');

    // Mock readFile to throw ENOENT error
    const readFileMock = vi.mocked(readFile);
    readFileMock.mockRejectedValueOnce(
        Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
    );

    // Clear the module cache and re-import to get fresh module with mock
    vi.resetModules();
    const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
    const { updateEmhttpState } = await import('@app/store/modules/emhttp.js');
    const { store: freshStore } = await import('@app/store/index.js');

    // Set key file location to a non-existent file
    freshStore.dispatch(
        updateEmhttpState({
            field: StateFileKey.var,
            state: {
                regFile: '/boot/config/Pro.key',
            },
        })
    );

    // Should return empty string when file doesn't exist
    await expect(getKeyFile()).resolves.toBe('');

    // Clear mock
    readFileMock.mockReset();
    vi.resetModules();
});

test('Returns decoded key file if key location exists', async () => {
    const { readFile } = await import('fs/promises');

    // Mock a valid key file content
    const mockKeyContent =
        'hVs1tLjvC9FiiQsIwIQ7G1KszAcexf0IneThhnmf22SB0dGs5WzRkqMiSMmt2DtR5HOXFUD32YyxuzGeUXmky3zKpSu6xhZNKVg5atGM1OfvkzHBMldI3SeBLuUFSgejLbpNUMdTrbk64JJdbzle4O8wiQgkIpAMIGxeYLwLBD4zHBcfyzq40QnxG--HcX6j25eE0xqa2zWj-j0b0rCAXahJV2a3ySCbPzr1MvfPRTVb0rr7KJ-25R592hYrz4H7Sc1B3p0lr6QUxHE6o7bcYrWKDRtIVoZ8SMPpd1_0gzYIcl5GsDFzFumTXUh8NEnl0Q8hwW1YE-tRc6Y_rrvd7w==';
    const binaryContent = Buffer.from(mockKeyContent, 'base64').toString('binary');

    const readFileMock = vi.mocked(readFile);
    readFileMock.mockResolvedValue(binaryContent);

    // Clear the module cache and re-import to get fresh module with mock
    vi.resetModules();
    const { getKeyFile } = await import('@app/core/utils/misc/get-key-file.js');
    const { loadStateFiles } = await import('@app/store/modules/emhttp.js');
    const { loadRegistrationKey } = await import('@app/store/modules/registration.js');
    const { store: freshStore } = await import('@app/store/index.js');

    // Load state files into store
    await freshStore.dispatch(loadStateFiles());
    await freshStore.dispatch(loadRegistrationKey());
    // Check if store has state files loaded
    const { status } = freshStore.getState().registration;
    expect(status).toBe(FileLoadStatus.LOADED);

    const result = await getKeyFile();
    expect(result).toBe(
        'hVs1tLjvC9FiiQsIwIQ7G1KszAcexf0IneThhnmf22SB0dGs5WzRkqMiSMmt2DtR5HOXFUD32YyxuzGeUXmky3zKpSu6xhZNKVg5atGM1OfvkzHBMldI3SeBLuUFSgejLbpNUMdTrbk64JJdbzle4O8wiQgkIpAMIGxeYLwLBD4zHBcfyzq40QnxG--HcX6j25eE0xqa2zWj-j0b0rCAXahJV2a3ySCbPzr1MvfPRTVb0rr7KJ-25R592hYrz4H7Sc1B3p0lr6QUxHE6o7bcYrWKDRtIVoZ8SMPpd1_0gzYIcl5GsDFzFumTXUh8NEnl0Q8hwW1YE-tRc6Y_rrvd7w'
    );

    // Clear mock
    readFileMock.mockReset();
    vi.resetModules();
}, 10000);
