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
        vi.useFakeTimers();
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
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('debounces sync operations and writes once after rapid updates', () => {
        getState.mockReturnValue({ count: 2 });

        subscriber?.();
        vi.advanceTimersByTime(500);
        subscriber?.();

        expect(setSpy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);

        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith('store', { count: 2 });
    });

    it('skips writes when serialized state is unchanged', () => {
        getState.mockReturnValue({ count: 1 });

        subscriber?.();
        vi.advanceTimersByTime(1000);

        subscriber?.();
        vi.advanceTimersByTime(1000);

        expect(setSpy).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes and clears timer on module destroy', () => {
        getState.mockReturnValue({ count: 1 });

        subscriber?.();
        service.onModuleDestroy();
        vi.advanceTimersByTime(1000);

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(setSpy).not.toHaveBeenCalled();
    });
});
