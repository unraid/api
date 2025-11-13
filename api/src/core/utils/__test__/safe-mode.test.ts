import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSafeModeEnabled } from '@app/core/utils/safe-mode.js';
import { store } from '@app/store/index.js';
import * as stateFileLoader from '@app/store/services/state-file-loader.js';

describe('isSafeModeEnabled', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the safe mode flag already present in the store', () => {
        const baseState = store.getState();
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            emhttp: {
                ...baseState.emhttp,
                var: {
                    ...(baseState.emhttp?.var ?? {}),
                    safeMode: true,
                },
            },
        });
        const loaderSpy = vi.spyOn(stateFileLoader, 'loadStateFileSync');

        expect(isSafeModeEnabled()).toBe(true);
        expect(loaderSpy).not.toHaveBeenCalled();
    });

    it('falls back to the synchronous loader when store state is missing', () => {
        const baseState = store.getState();
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            emhttp: {
                ...baseState.emhttp,
                var: {
                    ...(baseState.emhttp?.var ?? {}),
                    safeMode: undefined as unknown as boolean,
                } as typeof baseState.emhttp.var,
            } as typeof baseState.emhttp,
        } as typeof baseState);
        vi.spyOn(stateFileLoader, 'loadStateFileSync').mockReturnValue({
            ...(baseState.emhttp?.var ?? {}),
            safeMode: true,
        } as any);

        expect(isSafeModeEnabled()).toBe(true);
    });

    it('defaults to false when loader cannot provide state', () => {
        const baseState = store.getState();
        vi.spyOn(store, 'getState').mockReturnValue({
            ...baseState,
            emhttp: {
                ...baseState.emhttp,
                var: {
                    ...(baseState.emhttp?.var ?? {}),
                    safeMode: undefined as unknown as boolean,
                } as typeof baseState.emhttp.var,
            } as typeof baseState.emhttp,
        } as typeof baseState);
        vi.spyOn(stateFileLoader, 'loadStateFileSync').mockReturnValue(null);

        expect(isSafeModeEnabled()).toBe(false);
    });
});
