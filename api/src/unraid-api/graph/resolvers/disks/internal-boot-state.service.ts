import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import type { Cache } from 'cache-manager';

import type { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Injectable()
export class InternalBootStateService {
    private readonly INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY =
        'internal-boot-state:has-internal-boot-devices';
    private readonly INTERNAL_BOOT_DEVICE_SETUP_TTL_MS = 10000;
    private pendingHasInternalBootDevicesLookup: Promise<boolean> | null = null;

    constructor(
        private readonly arrayService: ArrayService,
        private readonly disksService: DisksService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) {}

    public async getBootedFromFlashWithInternalBootSetup(): Promise<boolean> {
        const array = await this.arrayService.getArrayData();
        return this.getBootedFromFlashWithInternalBootSetupForBootDisk(array.boot);
    }

    public async getBootedFromFlashWithInternalBootSetupForBootDisk(
        bootDisk: Pick<ArrayDisk, 'type'> | null | undefined
    ): Promise<boolean> {
        if (!bootDisk || bootDisk.type !== ArrayDiskType.FLASH) {
            return false;
        }

        return this.getHasInternalBootDevices();
    }

    public async invalidateCachedInternalBootDeviceState(): Promise<void> {
        this.pendingHasInternalBootDevicesLookup = null;
        await this.cacheManager.del(this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY);
    }

    private async getHasInternalBootDevices(): Promise<boolean> {
        const cachedValue = await this.cacheManager.get<boolean>(
            this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY
        );
        if (typeof cachedValue === 'boolean') {
            return cachedValue;
        }

        if (!this.pendingHasInternalBootDevicesLookup) {
            this.pendingHasInternalBootDevicesLookup = this.loadHasInternalBootDevices();
        }

        try {
            return await this.pendingHasInternalBootDevicesLookup;
        } finally {
            this.pendingHasInternalBootDevicesLookup = null;
        }
    }

    private async loadHasInternalBootDevices(): Promise<boolean> {
        const hasInternalBootDevices = (await this.disksService.getInternalBootDevices()).length > 0;
        await this.cacheManager.set(
            this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY,
            hasInternalBootDevices,
            this.INTERNAL_BOOT_DEVICE_SETUP_TTL_MS
        );
        return hasInternalBootDevices;
    }
}
