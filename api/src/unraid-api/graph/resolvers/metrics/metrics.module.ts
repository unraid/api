import { Module } from '@nestjs/common';

import { CpuModule } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.module.js';
import { MemoryBreakdownService } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';
import { MemoryUtilizationResolver } from '@app/unraid-api/graph/resolvers/info/memory/memory-utilization.resolver.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { NetworkMetricsService } from '@app/unraid-api/graph/resolvers/metrics/network/network.service.js';
import { TemperatureModule } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.module.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ServicesModule, CpuModule, TemperatureModule],
    providers: [
        MetricsResolver,
        MemoryService,
        MemoryBreakdownService,
        MemoryUtilizationResolver,
        NetworkMetricsService,
    ],
    exports: [MetricsResolver],
})
export class MetricsModule {}
