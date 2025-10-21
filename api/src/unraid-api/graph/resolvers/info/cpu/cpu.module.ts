import { Module } from '@nestjs/common';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';

@Module({
    providers: [CpuService, CpuTopologyService],
    exports: [CpuService, CpuTopologyService],
})
export class CpuModule {}
