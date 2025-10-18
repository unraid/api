import { Module } from '@nestjs/common';

import { CpuPowerService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-power.service.js';
import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';

@Module({
    providers: [CpuService, CpuPowerService, CpuTopologyService],
    exports: [CpuService, CpuPowerService, CpuTopologyService],
})
export class CpuModule {}
