import { Module } from '@nestjs/common';

import { LogWatcherManager } from '@app/unraid-api/graph/resolvers/logs/log-watcher-manager.service.js';
import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';

@Module({
    imports: [ServicesModule],
    providers: [LogsResolver, LogsService, LogWatcherManager],
    exports: [LogsService, LogWatcherManager],
})
export class LogsModule {}
