import { Module } from '@nestjs/common';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuModule } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.module.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ServicesModule, CpuModule],
    providers: [MetricsResolver, MemoryService],
    exports: [MetricsResolver],
})
export class MetricsModule {}
