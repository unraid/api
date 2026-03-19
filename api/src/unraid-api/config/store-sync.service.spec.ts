import { ConfigService } from '@nestjs/config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StoreSyncService } from '@app/unraid-api/config/store-sync.service.js';

const { subscribe, getState } = vi.hoisted(() => ({
    subscribe: vi.fn(),
    getState: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    store: {
        subscribe,
        getState,
    },
}));

describe('StoreSyncService', () => {
    let service: StoreSyncService;
    let configService: ConfigService;
    let setSpy: ReturnType<typeof vi.spyOn>;
    let unsubscribe: ReturnType<typeof vi.fn>;
    let subscriber: (() => void) | undefined;

    beforeEach(() => {
        subscribe.mockReset();
        getState.mockReset();

        unsubscribe = vi.fn();
        subscriber = undefined;

        subscribe.mockImplementation((callback: () => void) => {
            subscriber = callback;
            return unsubscribe;
        });

        configService = new ConfigService();
        setSpy = vi.spyOn(configService, 'set');

        service = new StoreSyncService(configService);
    });

    afterEach(() => {
        service.onModuleDestroy();
    });

    it('syncs store updates immediately', () => {
        getState.mockReturnValue({ count: 1 });

        subscriber?.();

        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith('store', { count: 1 });
    });

    it('skips writes when serialized state is unchanged', () => {
        getState.mockReturnValue({ count: 1 });

        subscriber?.();
        subscriber?.();

        expect(setSpy).toHaveBeenCalledTimes(1);
    });

    it('writes again when the store state changes', () => {
        getState.mockReturnValueOnce({ count: 1 }).mockReturnValueOnce({ count: 2 });

        subscriber?.();
        subscriber?.();

        expect(setSpy).toHaveBeenCalledTimes(2);
        expect(setSpy).toHaveBeenNthCalledWith(1, 'store', { count: 1 });
        expect(setSpy).toHaveBeenNthCalledWith(2, 'store', { count: 2 });
    });

    it('unsubscribes on module destroy', () => {
        getState.mockReturnValue({ count: 1 });

        service.onModuleDestroy();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});
