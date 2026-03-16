import type { Cache } from 'cache-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';

describe('InternalBootStateService', () => {
    const cacheStore = new Map<string, unknown>();
    const arrayService = {
        getArrayData: vi.fn(),
    };
    const disksService = {
        getInternalBootDevices: vi.fn(),
    };
    const cacheManager = {
        async get<T>(key: string): Promise<T | undefined> {
            return cacheStore.get(key) as T | undefined;
        },
        async set<T>(key: string, value: T): Promise<T> {
            cacheStore.set(key, value);
            return value;
        },
        async del(key: string): Promise<boolean> {
            return cacheStore.delete(key);
        },
    };
    const getSpy = vi.spyOn(cacheManager, 'get');
    const setSpy = vi.spyOn(cacheManager, 'set');
    const delSpy = vi.spyOn(cacheManager, 'del');

    const createService = () =>
        new InternalBootStateService(
            arrayService as unknown as ArrayService,
            disksService as unknown as DisksService,
            cacheManager as unknown as Cache
        );

    beforeEach(() => {
        cacheStore.clear();
        vi.clearAllMocks();
    });

    it('returns false without scanning disks when the system is not booted from flash', async () => {
        const service = createService();

        const result = await service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.CACHE,
        });

        expect(result).toBe(false);
        expect(disksService.getInternalBootDevices).not.toHaveBeenCalled();
        expect(getSpy).not.toHaveBeenCalled();
    });

    it('caches the internal boot device lookup result', async () => {
        disksService.getInternalBootDevices.mockResolvedValue([{ device: '/dev/nvme0n1' }]);
        const service = createService();

        const firstResult = await service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });
        const secondResult = await service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        expect(firstResult).toBe(true);
        expect(secondResult).toBe(true);
        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledTimes(1);
    });

    it('coalesces concurrent cache misses into a single disk scan', async () => {
        let resolveLookup: ((value: Array<{ device: string }>) => void) | undefined;

        disksService.getInternalBootDevices.mockImplementation(
            () =>
                new Promise<Array<{ device: string }>>((resolve) => {
                    resolveLookup = resolve;
                })
        );
        const service = createService();

        const firstLookup = service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });
        const secondLookup = service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        await Promise.resolve();

        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(1);

        resolveLookup?.([{ device: '/dev/nvme0n1' }]);

        await expect(firstLookup).resolves.toBe(true);
        await expect(secondLookup).resolves.toBe(true);
        expect(setSpy).toHaveBeenCalledTimes(1);
    });

    it('invalidates the cached lookup result when requested', async () => {
        disksService.getInternalBootDevices
            .mockResolvedValueOnce([{ device: '/dev/nvme0n1' }])
            .mockResolvedValueOnce([]);
        const service = createService();

        const initialResult = await service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        await service.invalidateCachedInternalBootDeviceState();

        const refreshedResult = await service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        expect(initialResult).toBe(true);
        expect(refreshedResult).toBe(false);
        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(2);
        expect(delSpy).toHaveBeenCalledTimes(1);
    });

    it('does not repopulate the cache with a stale in-flight lookup after invalidation', async () => {
        let resolveFirstLookup: ((value: Array<{ device: string }>) => void) | undefined;
        let resolveSecondLookup: ((value: Array<{ device: string }>) => void) | undefined;

        disksService.getInternalBootDevices
            .mockImplementationOnce(
                () =>
                    new Promise<Array<{ device: string }>>((resolve) => {
                        resolveFirstLookup = resolve;
                    })
            )
            .mockImplementationOnce(
                () =>
                    new Promise<Array<{ device: string }>>((resolve) => {
                        resolveSecondLookup = resolve;
                    })
            );
        const service = createService();

        const firstLookup = service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        await Promise.resolve();
        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(1);

        await service.invalidateCachedInternalBootDeviceState();
        resolveFirstLookup?.([{ device: '/dev/nvme0n1' }]);

        await expect(firstLookup).resolves.toBe(true);
        expect(setSpy).not.toHaveBeenCalled();

        const secondLookup = service.getBootedFromFlashWithInternalBootSetupForBootDisk({
            type: ArrayDiskType.FLASH,
        });

        await Promise.resolve();
        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(2);

        resolveSecondLookup?.([]);

        await expect(secondLookup).resolves.toBe(false);
        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenLastCalledWith(
            'internal-boot-state:has-internal-boot-devices',
            false,
            10000
        );
    });

    it('uses array boot data for the shared top-level lookup', async () => {
        arrayService.getArrayData.mockResolvedValue({
            boot: {
                type: ArrayDiskType.FLASH,
            },
        });
        disksService.getInternalBootDevices.mockResolvedValue([{ device: '/dev/nvme0n1' }]);
        const service = createService();

        await expect(service.getBootedFromFlashWithInternalBootSetup()).resolves.toBe(true);
        expect(arrayService.getArrayData).toHaveBeenCalledTimes(1);
        expect(disksService.getInternalBootDevices).toHaveBeenCalledTimes(1);
    });
});
