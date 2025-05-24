import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import { BackupResolver } from '@app/unraid-api/graph/resolvers/backup/backup.resolver.js';
import { FormatService } from '@app/unraid-api/graph/resolvers/backup/format.service.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [RCloneModule, ScheduleModule.forRoot()],
    providers: [BackupResolver, BackupConfigService, FormatService],
    exports: [],
})
export class BackupModule {}
