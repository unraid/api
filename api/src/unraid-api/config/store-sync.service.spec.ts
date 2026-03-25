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
    });

    afterEach(() => {
        service?.onModuleDestroy();
    });

    it('syncs the current store state immediately on construction', () => {
        getState.mockReturnValue({ count: 1 });

        service = new StoreSyncService(configService);

        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith('store', { count: 1 });
    });

    it('writes immediately when the store updates', () => {
        getState.mockReturnValue({ count: 1 });
        service = new StoreSyncService(configService);
        setSpy.mockClear();
        getState.mockReturnValue({ count: 2 });

        subscriber?.();

        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith('store', { count: 2 });
    });

    it('skips writes when serialized state is unchanged', () => {
        getState.mockReturnValue({ count: 1 });
        service = new StoreSyncService(configService);
        setSpy.mockClear();
        getState.mockReturnValue({ count: 2 });

        subscriber?.();
        getState.mockReturnValue({ count: 2 });
        subscriber?.();

        expect(setSpy).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on module destroy', () => {
        getState.mockReturnValue({ count: 1 });
        service = new StoreSyncService(configService);
        setSpy.mockClear();
        service.onModuleDestroy();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});
