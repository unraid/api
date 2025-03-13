import { Module } from '@nestjs/common';

import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';

@Module({
    providers: [LogsResolver, LogsService],
    exports: [LogsService],
})
export class LogsModule {}
