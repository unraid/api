import type { Cache } from 'cache-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';

describe('InternalBootStateService', () => {
    const cacheStore = new Map<string, boolean>();
    const arrayService = {
        getArrayData: vi.fn(),
    };
    const disksService = {
        getInternalBootDevices: vi.fn(),
    };
    const cacheManager = {
        get: vi.fn(async (key: string) => cacheStore.get(key)),
        set: vi.fn(async (key: string, value: boolean) => {
            cacheStore.set(key, value);
        }),
        del: vi.fn(async (key: string) => {
            cacheStore.delete(key);
        }),
    } satisfies Pick<Cache, 'get' | 'set' | 'del'>;

    const createService = () =>
        new InternalBootStateService(
            arrayService as unknown as ArrayService,
            disksService as unknown as DisksService,
            cacheManager as Cache
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
        expect(cacheManager.get).not.toHaveBeenCalled();
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
        expect(cacheManager.set).toHaveBeenCalledTimes(1);
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
        expect(cacheManager.set).toHaveBeenCalledTimes(1);
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
        expect(cacheManager.del).toHaveBeenCalledTimes(1);
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
