import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StateFileKey } from '@app/store/types.js';
import { RegistrationType } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

// Mock the store module
vi.mock('@app/store/index.js', () => ({
    store: {
        dispatch: vi.fn(),
    },
    getters: {
        emhttp: vi.fn(),
    },
}));

// Mock the emhttp module
vi.mock('@app/store/modules/emhttp.js', () => ({
    loadSingleStateFile: vi.fn((key) => ({ type: 'emhttp/load-single-state-file', payload: key })),
}));

// Mock the registration module
vi.mock('@app/store/modules/registration.js', () => ({
    loadRegistrationKey: vi.fn(() => ({ type: 'registration/load-registration-key' })),
}));

// Mock the logger
vi.mock('@app/core/log.js', () => ({
    keyServerLogger: {
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('reloadVarIniWithRetry', () => {
    let store: { dispatch: ReturnType<typeof vi.fn> };
    let getters: { emhttp: ReturnType<typeof vi.fn> };
    let loadSingleStateFile: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.useFakeTimers();

        const storeModule = await import('@app/store/index.js');
        const emhttpModule = await import('@app/store/modules/emhttp.js');

        store = storeModule.store as unknown as typeof store;
        getters = storeModule.getters as unknown as typeof getters;
        loadSingleStateFile = emhttpModule.loadSingleStateFile as unknown as typeof loadSingleStateFile;

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns early when registration state changes on first retry', async () => {
        // Initial state is TRIAL
        getters.emhttp
            .mockReturnValueOnce({ var: { regTy: RegistrationType.TRIAL } }) // First call (beforeState)
            .mockReturnValueOnce({ var: { regTy: RegistrationType.UNLEASHED } }); // After first reload

        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        const promise = reloadVarIniWithRetry();

        // Advance past the first delay (500ms)
        await vi.advanceTimersByTimeAsync(500);
        await promise;

        // Should only dispatch once since state changed
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(loadSingleStateFile).toHaveBeenCalledWith(StateFileKey.var);
    });

    it('retries up to maxRetries when state does not change', async () => {
        // State never changes
        getters.emhttp.mockReturnValue({ var: { regTy: RegistrationType.TRIAL } });

        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        const promise = reloadVarIniWithRetry(3);

        // Advance through all retries: 500ms, 1000ms, 2000ms
        await vi.advanceTimersByTimeAsync(500);
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);
        await promise;

        // Should dispatch 3 times (maxRetries)
        expect(store.dispatch).toHaveBeenCalledTimes(3);
    });

    it('stops retrying when state changes on second attempt', async () => {
        getters.emhttp
            .mockReturnValueOnce({ var: { regTy: RegistrationType.TRIAL } }) // beforeState
            .mockReturnValueOnce({ var: { regTy: RegistrationType.TRIAL } }) // After first reload (no change)
            .mockReturnValueOnce({ var: { regTy: RegistrationType.UNLEASHED } }); // After second reload (changed!)

        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        const promise = reloadVarIniWithRetry(3);

        // First retry
        await vi.advanceTimersByTimeAsync(500);
        // Second retry
        await vi.advanceTimersByTimeAsync(1000);
        await promise;

        // Should dispatch twice - stopped after state changed
        expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    it('handles undefined regTy gracefully', async () => {
        getters.emhttp.mockReturnValue({ var: {} });

        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        const promise = reloadVarIniWithRetry(1);

        await vi.advanceTimersByTimeAsync(500);
        await promise;

        // Should still dispatch even with undefined regTy
        expect(store.dispatch).toHaveBeenCalledTimes(1);
    });

    it('uses exponential backoff delays', async () => {
        getters.emhttp.mockReturnValue({ var: { regTy: RegistrationType.TRIAL } });

        const { reloadVarIniWithRetry } = await import('@app/store/watch/registration-watch.js');

        const promise = reloadVarIniWithRetry(3);

        // At 0ms, no dispatch yet
        expect(store.dispatch).toHaveBeenCalledTimes(0);

        // At 500ms, first dispatch
        await vi.advanceTimersByTimeAsync(500);
        expect(store.dispatch).toHaveBeenCalledTimes(1);

        // At 1500ms (500 + 1000), second dispatch
        await vi.advanceTimersByTimeAsync(1000);
        expect(store.dispatch).toHaveBeenCalledTimes(2);

        // At 3500ms (500 + 1000 + 2000), third dispatch
        await vi.advanceTimersByTimeAsync(2000);
        expect(store.dispatch).toHaveBeenCalledTimes(3);

        await promise;
    });
});
