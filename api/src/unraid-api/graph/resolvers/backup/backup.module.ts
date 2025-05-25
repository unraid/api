import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import { BackupMutationsResolver } from '@app/unraid-api/graph/resolvers/backup/backup-mutations.resolver.js';
import {
    BackupJobConfigResolver,
    BackupResolver,
} from '@app/unraid-api/graph/resolvers/backup/backup.resolver.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [RCloneModule, ScheduleModule.forRoot()],
    providers: [BackupResolver, BackupJobConfigResolver, BackupMutationsResolver, BackupConfigService],
    exports: [],
})
export class BackupModule {}
