import { Injectable } from '@nestjs/common';

import { mem, memLayout } from 'systeminformation';

import {
    InfoMemory,
    MemoryLayout,
    MemoryUtilization,
} from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';

@Injectable()
export class MemoryService {
    async generateMemory(): Promise<InfoMemory> {
        const layout = await memLayout()
            .then((dims) =>
                dims.map(
                    (dim, index) =>
                        ({
                            ...dim,
                            id: `memory-layout-${index}`,
                        }) as MemoryLayout
                )
            )
            .catch(() => []);

        return {
            id: 'info/memory',
            layout,
        };
    }

    async generateMemoryLoad(): Promise<MemoryUtilization> {
        const memInfo = await mem();

        return {
            id: 'memory-utilization',
            total: Math.floor(memInfo.total),
            used: Math.floor(memInfo.used),
            free: Math.floor(memInfo.free),
            available: Math.floor(memInfo.available),
            active: Math.floor(memInfo.active),
            buffcache: Math.floor(memInfo.buffcache),
            percentTotal:
                memInfo.total > 0 ? ((memInfo.total - memInfo.available) / memInfo.total) * 100 : 0,
            swapTotal: Math.floor(memInfo.swaptotal),
            swapUsed: Math.floor(memInfo.swapused),
            swapFree: Math.floor(memInfo.swapfree),
            percentSwapTotal: memInfo.swaptotal > 0 ? (memInfo.swapused / memInfo.swaptotal) * 100 : 0,
        };
    }
}
