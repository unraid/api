import { Module } from '@nestjs/common';

import { CpuModule } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.module.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { MetricsResolver } from '@app/unraid-api/graph/resolvers/metrics/metrics.resolver.js';
import { TemperatureModule } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.module.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ServicesModule, CpuModule, TemperatureModule],
    providers: [MetricsResolver, MemoryService],
    exports: [MetricsResolver],
})
export class MetricsModule {}
