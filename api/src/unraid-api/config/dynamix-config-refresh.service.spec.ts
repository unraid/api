import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileLoadStatus } from '@app/store/types.js';
import { DynamixConfigRefreshService } from '@app/unraid-api/config/dynamix-config-refresh.service.js';

const { dispatch, getState, loadDynamixConfigFromDiskSync, updateDynamixConfig } = vi.hoisted(() => ({
    dispatch: vi.fn(),
    getState: vi.fn(),
    loadDynamixConfigFromDiskSync: vi.fn(),
    updateDynamixConfig: vi.fn((payload: unknown) => ({ type: 'dynamix/update', payload })),
}));

vi.mock('@app/store/index.js', () => ({
    store: {
        dispatch,
        getState,
    },
}));

vi.mock('@app/store/actions/load-dynamix-config-file.js', () => ({
    loadDynamixConfigFromDiskSync,
}));

vi.mock('@app/store/modules/dynamix.js', () => ({
    updateDynamixConfig,
}));

describe('DynamixConfigRefreshService', () => {
    let service: DynamixConfigRefreshService;

    beforeEach(() => {
        vi.useFakeTimers();
        dispatch.mockReset();
        getState.mockReset();
        loadDynamixConfigFromDiskSync.mockReset();
        updateDynamixConfig.mockClear();

        getState.mockReturnValue({
            paths: {
                'dynamix-config': ['/etc/default.cfg', '/boot/config/plugins/dynamix/dynamix.cfg'],
            },
        });

        service = new DynamixConfigRefreshService();
    });

    afterEach(() => {
        service.onModuleDestroy();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('loads on init and dispatches loaded status', () => {
        loadDynamixConfigFromDiskSync.mockReturnValue({ notify: { path: '/tmp/notifications' } });

        service.onModuleInit();

        expect(loadDynamixConfigFromDiskSync).toHaveBeenCalledWith([
            '/etc/default.cfg',
            '/boot/config/plugins/dynamix/dynamix.cfg',
        ]);
        expect(updateDynamixConfig).toHaveBeenCalledWith({
            notify: { path: '/tmp/notifications' },
            status: FileLoadStatus.LOADED,
        });
        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('skips dispatch when loaded config is unchanged', () => {
        loadDynamixConfigFromDiskSync.mockReturnValue({ notify: { path: '/tmp/notifications' } });

        service.onModuleInit();
        vi.advanceTimersByTime(5000);

        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('dispatches failed status when loading throws', () => {
        loadDynamixConfigFromDiskSync.mockImplementation(() => {
            throw new Error('boom');
        });

        service.onModuleInit();

        expect(updateDynamixConfig).toHaveBeenCalledWith({ status: FileLoadStatus.FAILED_LOADING });
        expect(dispatch).toHaveBeenCalledTimes(1);
    });
});
