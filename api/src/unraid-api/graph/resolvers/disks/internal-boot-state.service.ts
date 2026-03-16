import { Injectable } from '@nestjs/common';

import type { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Injectable()
export class InternalBootStateService {
    constructor(
        private readonly arrayService: ArrayService,
        private readonly disksService: DisksService
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

        const internalBootDevices = await this.disksService.getInternalBootDevices();
        return internalBootDevices.length > 0;
    }
}
