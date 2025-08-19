import { Module } from '@nestjs/common';

import { CpuDataService, CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ServicesModule],
    providers: [MetricsResolver, CpuService, CpuDataService, MemoryService],
    exports: [MetricsResolver],
})
export class MetricsModule {}
