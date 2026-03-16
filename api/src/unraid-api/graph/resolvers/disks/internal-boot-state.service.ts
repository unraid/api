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
    private pendingHasInternalBootDevicesLookupGeneration: number | null = null;
    private internalBootLookupGeneration = 0;

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
        this.internalBootLookupGeneration += 1;
        this.pendingHasInternalBootDevicesLookup = null;
        this.pendingHasInternalBootDevicesLookupGeneration = null;
        await this.cacheManager.del(this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY);
    }

    private async getHasInternalBootDevices(): Promise<boolean> {
        const cachedValue = await this.cacheManager.get<boolean>(
            this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY
        );
        if (typeof cachedValue === 'boolean') {
            return cachedValue;
        }

        const lookupGeneration = this.internalBootLookupGeneration;
        if (
            !this.pendingHasInternalBootDevicesLookup ||
            this.pendingHasInternalBootDevicesLookupGeneration !== lookupGeneration
        ) {
            this.pendingHasInternalBootDevicesLookup = this.loadHasInternalBootDevices(lookupGeneration);
            this.pendingHasInternalBootDevicesLookupGeneration = lookupGeneration;
        }

        return this.pendingHasInternalBootDevicesLookup;
    }

    private async loadHasInternalBootDevices(lookupGeneration: number): Promise<boolean> {
        try {
            const hasInternalBootDevices = (await this.disksService.getInternalBootDevices()).length > 0;

            if (lookupGeneration === this.internalBootLookupGeneration) {
                await this.cacheManager.set(
                    this.INTERNAL_BOOT_DEVICE_SETUP_CACHE_KEY,
                    hasInternalBootDevices,
                    this.INTERNAL_BOOT_DEVICE_SETUP_TTL_MS
                );
            }

            return hasInternalBootDevices;
        } finally {
            if (
                lookupGeneration === this.internalBootLookupGeneration &&
                this.pendingHasInternalBootDevicesLookupGeneration === lookupGeneration
            ) {
                this.pendingHasInternalBootDevicesLookup = null;
                this.pendingHasInternalBootDevicesLookupGeneration = null;
            }
        }
    }
}
