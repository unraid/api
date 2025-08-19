import { Injectable } from '@nestjs/common';

import { osInfo } from 'systeminformation';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { getters } from '@app/store/index.js';
import { InfoOs } from '@app/unraid-api/graph/resolvers/info/os/os.model.js';

@Injectable()
export class OsService {
    async generateOs(): Promise<InfoOs> {
        const os = await osInfo();

        return {
            id: 'info/os',
            ...os,
            hostname: getters.emhttp().var.name,
            uptime: bootTimestamp.toISOString(),
        };
    }
}
