import { Module } from '@nestjs/common';

import { SystemTimeResolver } from '@app/unraid-api/graph/resolvers/system-time/system-time.resolver.js';
import { SystemTimeService } from '@app/unraid-api/graph/resolvers/system-time/system-time.service.js';

@Module({
    providers: [SystemTimeResolver, SystemTimeService],
})
export class SystemTimeModule {}
